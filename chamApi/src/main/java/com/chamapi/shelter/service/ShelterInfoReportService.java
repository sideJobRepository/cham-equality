package com.chamapi.shelter.service;

import com.chamapi.common.dto.PageResponse;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.file.dto.request.FileRequest;
import com.chamapi.file.dto.response.FileViewResponse;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileProcessStatus;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import com.chamapi.file.service.S3FileService;
import com.chamapi.shelter.auth.UserPasswordValidator;
import com.chamapi.shelter.dto.request.ShelterInfoReportCreateRequest;
import com.chamapi.shelter.dto.request.ShelterInfoReportUpdateRequest;
import com.chamapi.shelter.dto.response.ShelterReportDetailResponse;
import com.chamapi.shelter.dto.response.ShelterReportListResponse;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterImage;
import com.chamapi.shelter.entity.ShelterInfoReport;
import com.chamapi.shelter.enums.AdminReportFilter;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.repository.ShelterImageRepository;
import com.chamapi.shelter.repository.ShelterInfoReportRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 시민 대피소 정보 제보(신고)의 전 생명주기 비즈니스 로직.
 * 생성·조회·수정은 시민 공개 API({@link com.chamapi.shelter.controller.ShelterInfoReportController})가,
 * 목록·승인·반려·재조사는 관리자 API가 각각 호출한다.
 *
 * <p>핵심 정책:
 * <ul>
 *   <li>제출 게이트는 {@link Shelter#getSurveyStatus()}로 결정된다.
 *       NOT_INVESTIGATED은 자유 제출, INVESTIGATED은 차단, RE_INVESTIGATION은 USER_PASSWORD 필요.</li>
 *   <li>승인 시 해당 대피소의 다른 PENDING 신고는 모두 자동 반려되고 surveyStatus는 INVESTIGATED로 전환된다.</li>
 *   <li>반려된 신고의 첨부 이미지는 즉시 S3에서 삭제하지 않고 {@code TEMPORARY}로 되돌려
 *       {@code CommonFileSchedule}의 일일 정리 배치(01:00)가 수거한다.</li>
 *   <li>수정은 PENDING 상태에서만 허용된다({@code report.verifyPending()}).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterInfoReportService {

    private final ShelterInfoReportRepository shelterInfoReportRepository;
    private final ShelterImageRepository shelterImageRepository;
    private final CommonFileRepository commonFileRepository;
    private final ShelterRepository shelterRepository;
    private final S3FileService s3FileService;
    private final UserPasswordValidator userPasswordValidator;

    /**
     * 신고 생성 + 첨부 이미지의 대상 연결.
     * 이미지 업로드 자체는 프론트가 Presigned URL로 먼저 수행해 fileId를 확보한 뒤 여기로 넘긴다.
     *
     * <p>대피소의 surveyStatus에 따라 제출이 차단되거나 USER_PASSWORD 검증이 강제된다.
     */
    @Transactional
    public Long createReport(ShelterInfoReportCreateRequest request, String userPassword) {
        Shelter shelter = shelterRepository.findById(request.shelterId())
                .orElseThrow(() -> new BadRequestException("존재하지 않는 대피소 ID: " + request.shelterId()));

        ShelterSurveyStatus status = shelter.getSurveyStatus();
        if (status == ShelterSurveyStatus.INVESTIGATED) {
            throw new BadRequestException("이미 조사가 완료된 대피소입니다");
        }
        if (status == ShelterSurveyStatus.RE_INVESTIGATION) {
            userPasswordValidator.validate(userPassword);
        }

        ShelterInfoReport saved = shelterInfoReportRepository.save(request.toEntity());

        List<ShelterInfoReportCreateRequest.ImageItem> images = request.images();
        if (images != null && !images.isEmpty()) {
            attachImages(request.shelterId(), saved.getId(), images);
        }

        return saved.getId();
    }

    /**
     * 관리자 목록: 필터(null이면 전체) + 페이지네이션.
     * RE_INVESTIGATION 필터는 "재조사 상태 대피소에 들어온 PENDING 신고"만 골라낸다.
     * 시설명은 응답 가독성을 위해 Shelter에서 IN 쿼리 한 번으로 합쳐 내려보낸다(N+1 방지).
     */
    public PageResponse<ShelterReportListResponse> findReports(AdminReportFilter filter, Pageable pageable) {
        var page = fetchReportPage(filter, pageable);

        List<Long> shelterIds = page.getContent().stream()
                .map(ShelterInfoReport::getShelterId)
                .distinct()
                .toList();
        Map<Long, String> shelterNames = shelterIds.isEmpty()
                ? Map.of()
                : shelterRepository.findAllById(shelterIds).stream()
                        .collect(Collectors.toMap(Shelter::getId, Shelter::getName));

        return PageResponse.from(page.map(r ->
                ShelterReportListResponse.from(r, shelterNames.get(r.getShelterId()))
        ));
    }

    private org.springframework.data.domain.Page<ShelterInfoReport> fetchReportPage(AdminReportFilter filter, Pageable pageable) {
        if (filter == null) {
            return shelterInfoReportRepository.findAll(pageable);
        }
        return switch (filter) {
            case PENDING -> shelterInfoReportRepository.findAllByRequestStatus(ShelterInfoReportStatus.PENDING, pageable);
            case APPROVED -> shelterInfoReportRepository.findAllByRequestStatus(ShelterInfoReportStatus.APPROVED, pageable);
            case REJECTED -> shelterInfoReportRepository.findAllByRequestStatus(ShelterInfoReportStatus.REJECTED, pageable);
            case RE_INVESTIGATION -> shelterInfoReportRepository.findReInvestigationPending(pageable);
        };
    }

    /** 특정 대피소의 특정 상태 신고를 최신순으로. 프론트 목록 모달이 PENDING만 표시하는 데 쓴다. */
    public List<ShelterReportListResponse> findByShelterAndStatus(Long shelterId, ShelterInfoReportStatus status) {
        String shelterName = shelterRepository.findById(shelterId)
                .map(Shelter::getName)
                .orElse(null);
        return shelterInfoReportRepository
                .findAllByShelterIdAndRequestStatusOrderByCreateDateDesc(shelterId, status)
                .stream()
                .map(r -> ShelterReportListResponse.from(r, shelterName))
                .toList();
    }

    /**
     * 신고 상세 = 신고 본문 + 대피소 + 첨부 이미지(Presigned GET URL 포함).
     *
     * <p>이미지 활성 판별: {@code CommonFile} 테이블에 파일이 남아 있어도
     * {@code ShelterImage} 행이 없으면 표시하지 않는다. 반려된 신고의 파일은
     * {@code ShelterImage}만 먼저 지우고 {@code CommonFile}은 TEMPORARY로 전환해
     * 배치가 늦게 삭제하는 구조라, 이 필터가 없으면 "반려된 이미지"가 노출될 수 있다.
     */
    public ShelterReportDetailResponse getReportDetail(Long reportId) {
        ShelterInfoReport report = shelterInfoReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리포트 ID: " + reportId));

        Shelter shelter = shelterRepository.findById(report.getShelterId()).orElse(null);

        List<CommonFile> files = commonFileRepository.findByTargetIdAndFileType(reportId, FileType.SHELTER_IMAGE);
        List<Long> candidateFileIds = files.stream().map(CommonFile::getId).toList();

        // fileId → ShelterImage 매핑. 행이 없는 파일은 "반려 등으로 비활성화된 이미지"이므로 걸러낸다.
        Map<Long, ShelterImage> imageByFileId = candidateFileIds.isEmpty()
                ? Map.of()
                : shelterImageRepository.findAllByFileIdIn(candidateFileIds).stream()
                        .collect(Collectors.toMap(ShelterImage::getFileId, Function.identity(), (a, b) -> a));

        List<Long> activeFileIds = candidateFileIds.stream()
                .filter(imageByFileId::containsKey)
                .toList();

        List<FileViewResponse> views = s3FileService.getFilesForView(activeFileIds);

        List<ShelterReportDetailResponse.ImageView> imageViews = views.stream()
                .map(view -> {
                    ShelterImage img = imageByFileId.get(view.getFileId());
                    return new ShelterReportDetailResponse.ImageView(
                            view.getFileId(),
                            img != null ? img.getCategory() : null,
                            img != null ? img.getImageDescription() : null,
                            view.getUrl(),
                            view.getFileName()
                    );
                })
                .toList();

        return ShelterReportDetailResponse.of(report, shelter, imageViews);
    }

    /**
     * 신고 승인: 신고 본문을 실제 {@link Shelter}에 반영하고 상태를 APPROVED로 전환.
     * 동시에 대피소의 surveyStatus는 INVESTIGATED로 잠긴다.
     *
     * <p>같은 대피소에 기존 APPROVED 신고가 있다면(=재조사 후 재승인 케이스) 이전 승인본의 첨부 사진을
     * 정리한다: ShelterImage 행 제거 + CommonFile은 TEMPORARY로 환원해 일일 배치가 S3에서 수거하게 맡김.
     * 이전 APPROVED 신고 자체는 history 보존을 위해 status를 바꾸지 않는다.
     *
     * <p>같은 대피소의 다른 PENDING 신고는 같은 트랜잭션에서 자동 반려된다(중복 승인 방지).
     */
    @Transactional
    public void approve(Long reportId) {
        ShelterInfoReport report = shelterInfoReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리포트 ID: " + reportId));

        Shelter shelter = shelterRepository.findById(report.getShelterId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대피소 ID: " + report.getShelterId()));

        // 1) 이전 승인본의 사진 정리(있다면). report 본문은 보존.
        List<ShelterInfoReport> previousApproved = shelterInfoReportRepository
                .findAllByShelterIdAndRequestStatusOrderByCreateDateDesc(
                        report.getShelterId(), ShelterInfoReportStatus.APPROVED
                );
        for (ShelterInfoReport prev : previousApproved) {
            if (prev.getId().equals(reportId)) continue;
            cleanupImagesOf(prev);
        }

        // 2) shelter에 새 본문 반영 + report status 전환.
        shelter.applyReport(report);
        report.approve();

        // 3) 같은 대피소의 나머지 대기 신고를 일괄 반려. 방금 승인한 건은 이미 APPROVED라 목록에 안 들어오지만
        // 동일 트랜잭션의 영속성 컨텍스트 때문에 이중 체크로 건너뛴다.
        List<ShelterInfoReport> others = shelterInfoReportRepository
                .findAllByShelterIdAndRequestStatusOrderByCreateDateDesc(
                        report.getShelterId(), ShelterInfoReportStatus.PENDING
                );
        for (ShelterInfoReport other : others) {
            if (other.getId().equals(reportId)) continue;
            rejectInternal(other);
        }
    }

    /**
     * 신고의 첨부 사진만 비활성화하는 헬퍼. report.requestStatus는 그대로 둔다(history 보존).
     * S3 즉시 삭제 대신 {@code CommonFile}을 TEMPORARY로 환원해 일일 배치가 수거하게 맡긴다.
     */
    private void cleanupImagesOf(ShelterInfoReport report) {
        List<CommonFile> files = commonFileRepository
                .findByTargetIdAndFileType(report.getId(), FileType.SHELTER_IMAGE);
        if (files.isEmpty()) return;

        List<Long> fileIds = files.stream().map(CommonFile::getId).toList();
        shelterImageRepository.deleteAllByFileIdIn(fileIds);
        files.forEach(CommonFile::modifyTemporaryFileStatus);
    }

    /**
     * 재조사 요청: 승인된 신고에 대해 대피소를 다시 시민 제출 가능 상태로 풀어준다.
     * 새 제출은 USER_PASSWORD를 받아야 한다(시민 폼의 비번 입력칸이 활성화).
     */
    @Transactional
    public void requestReInvestigation(Long reportId) {
        ShelterInfoReport report = shelterInfoReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리포트 ID: " + reportId));
        if (report.getRequestStatus() != ShelterInfoReportStatus.APPROVED) {
            throw new BadRequestException("승인된 리포트만 재조사 요청 가능합니다");
        }
        Shelter shelter = shelterRepository.findById(report.getShelterId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대피소 ID: " + report.getShelterId()));
        shelter.markReInvestigation();
    }

    /**
     * 제출자 본인의 신고 수정. 상태가 PENDING이 아니면 예외.
     * 이미지 변경은 CREATE(새 업로드 파일 연결) / DELETE(기존 이미지 제거) 두 종류로 들어온다.
     */
    @Transactional
    public void updateReport(Long reportId, String password, ShelterInfoReportUpdateRequest request) {
        userPasswordValidator.validate(password);

        ShelterInfoReport report = shelterInfoReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리포트 ID: " + reportId));
        report.verifyPending();

        report.update(
                request.signageLanguage(),
                request.accessibleToilet(),
                request.ramp(),
                request.elevator(),
                request.brailleBlock(),
                request.etcFacilities(),
                request.requestNote()
        );

        List<ShelterInfoReportUpdateRequest.ImageChange> changes = request.imageChanges();
        if (changes == null || changes.isEmpty()) return;

        // 1) CommonFile 레벨 상태 전환(신규 업로드는 COMPLETE+targetId, 삭제는 TEMPORARY 환원).
        FileRequest fileRequest = new FileRequest();
        List<FileRequest.FileChangeRequest> fileChanges = changes.stream()
                .map(c -> FileRequest.FileChangeRequest.builder()
                        .id(c.fileId())
                        .fileProcessStatus(c.status())
                        .build())
                .toList();
        fileRequest.getFiles().addAll(fileChanges);
        s3FileService.modifyFileStatus(fileRequest, reportId);

        // 2) 삭제 대상의 ShelterImage 행 제거. 실제 S3 삭제는 일일 배치가 담당한다.
        List<Long> deleteFileIds = changes.stream()
                .filter(c -> c.status() == FileProcessStatus.DELETE)
                .map(ShelterInfoReportUpdateRequest.ImageChange::fileId)
                .toList();
        if (!deleteFileIds.isEmpty()) {
            shelterImageRepository.deleteAllByFileIdIn(deleteFileIds);
        }

        // 3) 신규 추가분을 ShelterImage로 기록(카테고리/설명 포함).
        List<ShelterImage> newRows = new ArrayList<>();
        for (var c : changes) {
            if (c.status() != FileProcessStatus.CREATE) continue;
            newRows.add(ShelterImage.builder()
                    .shelterId(report.getShelterId())
                    .fileId(c.fileId())
                    .category(c.category())
                    .imageDescription(c.description())
                    .build());
        }
        if (!newRows.isEmpty()) {
            shelterImageRepository.saveAll(newRows);
        }
    }

    /** 관리자 단독 반려. 승인 흐름에서 호출되는 {@link #rejectInternal}과 파일 정리 규칙을 공유한다. */
    @Transactional
    public void reject(Long reportId) {
        ShelterInfoReport report = shelterInfoReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리포트 ID: " + reportId));
        rejectInternal(report);
    }

    /**
     * 반려 공통 처리: 상태 전환 + 첨부 이미지 비활성화.
     * S3 오브젝트는 즉시 삭제하지 않고 {@code CommonFile}을 TEMPORARY로 되돌려
     * 다음 날 01:00 정리 배치가 수거하게 맡긴다(관리자 실수 번복 여지 + 트랜잭션 내 외부 호출 회피).
     */
    private void rejectInternal(ShelterInfoReport report) {
        report.reject();

        List<CommonFile> files = commonFileRepository
                .findByTargetIdAndFileType(report.getId(), FileType.SHELTER_IMAGE);
        if (files.isEmpty()) return;

        List<Long> fileIds = files.stream().map(CommonFile::getId).toList();
        shelterImageRepository.deleteAllByFileIdIn(fileIds);
        files.forEach(CommonFile::modifyTemporaryFileStatus);
    }

    /**
     * 생성 시 첨부 이미지 연결. 프론트가 미리 업로드해 둔 fileId들에
     * 방금 만들어진 reportId를 target으로 박고 COMPLETE 상태로 전환한다.
     * 요청에 포함됐더라도 DB에 존재하지 않는 fileId는 조용히 무시한다(악의적 id 주입 방어).
     */
    private void attachImages(Long shelterId, Long reportId, List<ShelterInfoReportCreateRequest.ImageItem> images) {
        List<Long> fileIds = images.stream()
                .map(ShelterInfoReportCreateRequest.ImageItem::fileId)
                .toList();

        Map<Long, CommonFile> filesById = commonFileRepository.findFilesIds(fileIds).stream()
                .collect(Collectors.toMap(CommonFile::getId, Function.identity()));

        List<ShelterImage> rows = images.stream()
                .filter(item -> filesById.containsKey(item.fileId()))
                .map(item -> {
                    CommonFile file = filesById.get(item.fileId());
                    file.createTargetIdAndModifyCompleteFileStatus(reportId);
                    return ShelterImage.builder()
                            .shelterId(shelterId)
                            .fileId(item.fileId())
                            .category(item.category())
                            .imageDescription(item.description())
                            .build();
                })
                .toList();

        shelterImageRepository.saveAll(rows);
    }
}

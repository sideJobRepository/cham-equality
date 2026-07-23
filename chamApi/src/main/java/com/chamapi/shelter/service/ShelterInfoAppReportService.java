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
import com.chamapi.shelter.dto.request.ShelterInfoAppReportCreateRequest;
import com.chamapi.shelter.dto.request.ShelterInfoAppReportUpdateRequest;
import com.chamapi.shelter.dto.response.ShelterAppReportDetailResponse;
import com.chamapi.shelter.dto.response.ShelterAppReportListResponse;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterImage;
import com.chamapi.shelter.entity.ShelterInfoAppReport;
import com.chamapi.shelter.enums.AdminReportFilter;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.repository.ShelterImageRepository;
import com.chamapi.shelter.repository.ShelterInfoAppReportRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 앱 시민 제보({@link ShelterInfoAppReport})의 시민 측 비즈니스 로직. 제보하기, 내 제보 목록·상세, 내 제보 수정.
 * 승인·반려는 관리자(기존 관리자 웹) 몫이라 이 서비스엔 없다.
 *
 * <p>이미지는 {@link FileType#APP_SHELTER_IMAGE}로 분리해 웹 제보({@code SHELTER_IMAGE})와 targetId가 겹치지 않게 한다.
 * 수정 시 본인 소유 + PENDING 상태만 허용한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterInfoAppReportService {

    private final ShelterInfoAppReportRepository shelterInfoAppReportRepository;
    private final ShelterImageRepository shelterImageRepository;
    private final CommonFileRepository commonFileRepository;
    private final ShelterRepository shelterRepository;
    private final S3FileService s3FileService;

    /**
     * 앱 제보 생성. 대피소 surveyStatus 게이트를 통과하면 PENDING으로 저장하고 첨부 이미지를 연결한다.
     * INVESTIGATED은 차단, NOT_INVESTIGATED·RE_INVESTIGATION은 로그인 시민이면 허용.
     */
    @Transactional
    public Long createReport(ShelterInfoAppReportCreateRequest request, Long memberId) {
        Shelter shelter = shelterRepository.findById(request.shelterId())
                .orElseThrow(() -> new BadRequestException("존재하지 않는 대피소 ID: " + request.shelterId()));

        if (shelter.getSurveyStatus() == ShelterSurveyStatus.INVESTIGATED) {
            throw new BadRequestException("이미 조사가 완료된 대피소입니다");
        }

        ShelterInfoAppReport saved = shelterInfoAppReportRepository.save(request.toEntity(memberId));

        List<ShelterInfoAppReportCreateRequest.ImageItem> images = request.images();
        if (images != null && !images.isEmpty()) {
            attachImages(request.shelterId(), saved.getId(), images);
        }

        return saved.getId();
    }

    /** 내가 제보한 목록(최신순). 상태 확인용이며 시설명을 IN 쿼리로 합쳐 내려보낸다(N+1 방지). */
    public List<ShelterAppReportListResponse> findMyReports(Long memberId) {
        List<ShelterInfoAppReport> reports = shelterInfoAppReportRepository.findAllByMemberIdOrderByCreateDateDesc(memberId);

        Map<Long, String> shelterNames = resolveShelterNames(reports.stream().map(ShelterInfoAppReport::getShelterId).toList());

        return reports.stream()
                .map(r -> ShelterAppReportListResponse.from(r, shelterNames.get(r.getShelterId())))
                .toList();
    }

    /** 내 제보 상세 = 본문 + 대피소 + 첨부 이미지(Presigned GET URL). 본인 소유가 아니면 조회 불가. */
    public ShelterAppReportDetailResponse getMyReportDetail(Long reportId, Long memberId) {
        ShelterInfoAppReport report = shelterInfoAppReportRepository.findByIdAndMemberId(reportId, memberId)
                .orElseThrow(() -> new BadRequestException("본인 제보가 아니거나 존재하지 않습니다"));

        Shelter shelter = shelterRepository.findById(report.getShelterId()).orElse(null);

        List<CommonFile> files = commonFileRepository.findByTargetIdAndFileType(reportId, FileType.APP_SHELTER_IMAGE);
        List<Long> candidateFileIds = files.stream().map(CommonFile::getId).toList();

        // ShelterImage 행이 없는 파일(삭제 등으로 비활성화)은 제외.
        Map<Long, ShelterImage> imageByFileId = candidateFileIds.isEmpty()
                ? Map.of()
                : shelterImageRepository.findAllByFileIdIn(candidateFileIds).stream()
                        .collect(Collectors.toMap(ShelterImage::getFileId, Function.identity(), (a, b) -> a));

        List<Long> activeFileIds = candidateFileIds.stream()
                .filter(imageByFileId::containsKey)
                .toList();

        List<FileViewResponse> views = s3FileService.getFilesForView(activeFileIds);

        List<ShelterAppReportDetailResponse.ImageView> imageViews = views.stream()
                .map(view -> {
                    ShelterImage img = imageByFileId.get(view.getFileId());
                    return new ShelterAppReportDetailResponse.ImageView(
                            view.getFileId(),
                            img != null ? img.getCategory() : null,
                            img != null ? img.getImageDescription() : null,
                            view.getUrl(),
                            view.getFileName()
                    );
                })
                .toList();

        return ShelterAppReportDetailResponse.of(report, shelter, imageViews);
    }

    /**
     * 내 제보 수정. 본인 소유 + PENDING 상태에서만 허용. 본문(접근성/안내문언어) + 사진(CREATE/DELETE) 변경.
     * 이미지 상태 전환은 웹 제보 수정과 동일 규칙({@code S3FileService#modifyFileStatus}, 파일 id 기준).
     */
    @Transactional
    public void updateReport(Long reportId, Long memberId, ShelterInfoAppReportUpdateRequest request) {
        ShelterInfoAppReport report = shelterInfoAppReportRepository.findByIdAndMemberId(reportId, memberId)
                .orElseThrow(() -> new BadRequestException("본인 제보가 아니거나 존재하지 않습니다"));
        report.verifyPending();

        report.update(
                request.signageLanguage(),
                request.accessibleToilet(),
                request.ramp(),
                request.elevator(),
                request.brailleBlock(),
                request.etcFacilities()
        );

        List<ShelterInfoAppReportUpdateRequest.ImageChange> changes = request.imageChanges();
        if (changes == null || changes.isEmpty()) return;

        // 1) CommonFile 레벨 상태 전환(CREATE: targetId+COMPLETE, DELETE: TEMPORARY 환원).
        FileRequest fileRequest = new FileRequest();
        List<FileRequest.FileChangeRequest> fileChanges = changes.stream()
                .map(c -> FileRequest.FileChangeRequest.builder()
                        .id(c.fileId())
                        .fileProcessStatus(c.status())
                        .build())
                .toList();
        fileRequest.getFiles().addAll(fileChanges);
        s3FileService.modifyFileStatus(fileRequest, reportId);

        // 2) 삭제 대상의 ShelterImage 행 제거(실제 S3 삭제는 일일 배치).
        List<Long> deleteFileIds = changes.stream()
                .filter(c -> c.status() == FileProcessStatus.DELETE)
                .map(ShelterInfoAppReportUpdateRequest.ImageChange::fileId)
                .toList();
        if (!deleteFileIds.isEmpty()) {
            shelterImageRepository.deleteAllByFileIdIn(deleteFileIds);
        }

        // 3) 신규 추가분을 ShelterImage로 기록.
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

    // ===== 관리자(승인/반려/조회) =====

    /**
     * 관리자 앱 제보 목록: 필터(null이면 전체) + 페이지네이션. 웹 제보와 동일 구조.
     * 앱 제보엔 재조사(RE_INVESTIGATION) 개념이 없어 해당 필터는 거부한다.
     */
    public PageResponse<ShelterAppReportListResponse> findReports(AdminReportFilter filter, Pageable pageable) {
        Page<ShelterInfoAppReport> page = fetchReportPage(filter, pageable);

        List<Long> shelterIds = page.getContent().stream()
                .map(ShelterInfoAppReport::getShelterId)
                .distinct()
                .toList();
        Map<Long, String> shelterNames = shelterIds.isEmpty()
                ? Map.of()
                : shelterRepository.findAllById(shelterIds).stream()
                        .collect(Collectors.toMap(Shelter::getId, Shelter::getName));

        return PageResponse.from(page.map(r ->
                ShelterAppReportListResponse.from(r, shelterNames.get(r.getShelterId()))
        ));
    }

    private Page<ShelterInfoAppReport> fetchReportPage(AdminReportFilter filter, Pageable pageable) {
        if (filter == null) {
            return shelterInfoAppReportRepository.findAll(pageable);
        }
        return switch (filter) {
            case PENDING -> shelterInfoAppReportRepository.findAllByRequestStatus(ShelterInfoReportStatus.PENDING, pageable);
            case APPROVED -> shelterInfoAppReportRepository.findAllByRequestStatus(ShelterInfoReportStatus.APPROVED, pageable);
            case REJECTED -> shelterInfoAppReportRepository.findAllByRequestStatus(ShelterInfoReportStatus.REJECTED, pageable);
            case RE_INVESTIGATION -> throw new BadRequestException("앱 제보엔 재조사 필터가 지원되지 않습니다");
        };
    }

    /** 관리자 상세: 소유권 검증 없이 조회. 이미지 활성 판별은 시민 상세와 동일. */
    public ShelterAppReportDetailResponse getReportDetailForAdmin(Long reportId) {
        ShelterInfoAppReport report = shelterInfoAppReportRepository.findById(reportId)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 앱 제보 ID: " + reportId));

        Shelter shelter = shelterRepository.findById(report.getShelterId()).orElse(null);

        List<CommonFile> files = commonFileRepository.findByTargetIdAndFileType(reportId, FileType.APP_SHELTER_IMAGE);
        List<Long> candidateFileIds = files.stream().map(CommonFile::getId).toList();

        Map<Long, ShelterImage> imageByFileId = candidateFileIds.isEmpty()
                ? Map.of()
                : shelterImageRepository.findAllByFileIdIn(candidateFileIds).stream()
                        .collect(Collectors.toMap(ShelterImage::getFileId, Function.identity(), (a, b) -> a));

        List<Long> activeFileIds = candidateFileIds.stream()
                .filter(imageByFileId::containsKey)
                .toList();

        List<FileViewResponse> views = s3FileService.getFilesForView(activeFileIds);

        List<ShelterAppReportDetailResponse.ImageView> imageViews = views.stream()
                .map(view -> {
                    ShelterImage img = imageByFileId.get(view.getFileId());
                    return new ShelterAppReportDetailResponse.ImageView(
                            view.getFileId(),
                            img != null ? img.getCategory() : null,
                            img != null ? img.getImageDescription() : null,
                            view.getUrl(),
                            view.getFileName()
                    );
                })
                .toList();

        return ShelterAppReportDetailResponse.of(report, shelter, imageViews);
    }

    /**
     * 앱 제보 승인. 웹 제보와 동일: 본문을 대피소에 반영(INVESTIGATED) + 상태 APPROVED + 첨부사진 승인 노출,
     * 같은 대피소의 이전 승인본 사진 정리, 같은 대피소의 다른 PENDING 앱 제보 자동 반려.
     * (웹 제보와의 상호 자동반려는 하지 않는다 - 각 타입 내에서만.)
     */
    @Transactional
    public void approve(Long reportId) {
        ShelterInfoAppReport report = shelterInfoAppReportRepository.findById(reportId)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 앱 제보 ID: " + reportId));

        Shelter shelter = shelterRepository.findById(report.getShelterId())
                .orElseThrow(() -> new BadRequestException("존재하지 않는 대피소 ID: " + report.getShelterId()));

        List<ShelterInfoAppReport> previousApproved = shelterInfoAppReportRepository
                .findAllByShelterIdAndRequestStatusOrderByCreateDateDesc(report.getShelterId(), ShelterInfoReportStatus.APPROVED);
        for (ShelterInfoAppReport prev : previousApproved) {
            if (prev.getId().equals(reportId)) continue;
            cleanupImagesOf(prev);
        }

        shelter.applyAppReport(report);
        report.approve();
        approveImagesOf(report);

        List<ShelterInfoAppReport> others = shelterInfoAppReportRepository
                .findAllByShelterIdAndRequestStatusOrderByCreateDateDesc(report.getShelterId(), ShelterInfoReportStatus.PENDING);
        for (ShelterInfoAppReport other : others) {
            if (other.getId().equals(reportId)) continue;
            rejectInternal(other);
        }
    }

    /** 앱 제보 반려. 첨부사진은 TEMPORARY 환원 후 일일 배치가 수거. */
    @Transactional
    public void reject(Long reportId) {
        ShelterInfoAppReport report = shelterInfoAppReportRepository.findById(reportId)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 앱 제보 ID: " + reportId));
        rejectInternal(report);
    }

    /**
     * 회원 탈퇴 시 그 회원의 앱 제보 삭제. 미승인(PENDING/REJECTED) 제보의 사진은 정리하고,
     * 승인(APPROVED) 제보의 사진은 이미 대피소 공개 데이터라 유지한 채 제보 행만 삭제한다.
     */
    @Transactional
    public void deleteAllByMember(Long memberId) {
        List<ShelterInfoAppReport> reports = shelterInfoAppReportRepository.findAllByMemberIdOrderByCreateDateDesc(memberId);
        for (ShelterInfoAppReport report : reports) {
            if (report.getRequestStatus() != ShelterInfoReportStatus.APPROVED) {
                cleanupImagesOf(report);
            }
        }
        shelterInfoAppReportRepository.deleteAll(reports);
    }

    /** 승인된 제보의 첨부사진을 승인 상태로 전환(공개 지도 노출). 웹 제보와 동일. */
    private void approveImagesOf(ShelterInfoAppReport report) {
        List<CommonFile> files = commonFileRepository
                .findByTargetIdAndFileType(report.getId(), FileType.APP_SHELTER_IMAGE);
        if (files.isEmpty()) return;

        List<Long> fileIds = files.stream().map(CommonFile::getId).toList();
        shelterImageRepository.findAllByFileIdIn(fileIds)
                .forEach(ShelterImage::approve);
    }

    /** 제보의 첨부사진만 비활성화(ShelterImage 삭제 + CommonFile TEMPORARY 환원). report 상태는 안 건드림. */
    private void cleanupImagesOf(ShelterInfoAppReport report) {
        List<CommonFile> files = commonFileRepository
                .findByTargetIdAndFileType(report.getId(), FileType.APP_SHELTER_IMAGE);
        if (files.isEmpty()) return;

        List<Long> fileIds = files.stream().map(CommonFile::getId).toList();
        shelterImageRepository.deleteAllByFileIdIn(fileIds);
        files.forEach(CommonFile::modifyTemporaryFileStatus);
    }

    /** 반려 공통 처리: 상태 전환 + 첨부사진 비활성화. */
    private void rejectInternal(ShelterInfoAppReport report) {
        report.reject();

        List<CommonFile> files = commonFileRepository
                .findByTargetIdAndFileType(report.getId(), FileType.APP_SHELTER_IMAGE);
        if (files.isEmpty()) return;

        List<Long> fileIds = files.stream().map(CommonFile::getId).toList();
        shelterImageRepository.deleteAllByFileIdIn(fileIds);
        files.forEach(CommonFile::modifyTemporaryFileStatus);
    }

    /**
     * 생성 시 첨부 이미지 연결. 앱이 미리 {@code APP_SHELTER_IMAGE}로 업로드해 둔 fileId에
     * 방금 만든 reportId를 target으로 박고 COMPLETE로 전환한다. DB에 없는 fileId는 조용히 무시.
     */
    private void attachImages(Long shelterId, Long reportId, List<ShelterInfoAppReportCreateRequest.ImageItem> images) {
        List<Long> fileIds = images.stream()
                .map(ShelterInfoAppReportCreateRequest.ImageItem::fileId)
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

    private Map<Long, String> resolveShelterNames(List<Long> shelterIds) {
        List<Long> distinct = shelterIds.stream().filter(Objects::nonNull).distinct().toList();
        if (distinct.isEmpty()) return Map.of();
        return shelterRepository.findAllById(distinct).stream()
                .collect(Collectors.toMap(Shelter::getId, Shelter::getName));
    }
}

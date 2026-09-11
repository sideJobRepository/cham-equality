package com.chamapi.feedback.service;

import com.chamapi.common.dto.PageResponse;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.feedback.dto.request.AppFeedbackAdminUpdateRequest;
import com.chamapi.feedback.dto.request.AppFeedbackCreateRequest;
import com.chamapi.feedback.dto.request.AppFeedbackUpdateRequest;
import com.chamapi.feedback.dto.response.AppFeedbackDetailResponse;
import com.chamapi.feedback.dto.response.AppFeedbackListResponse;
import com.chamapi.feedback.entity.AppFeedback;
import com.chamapi.feedback.enums.AppFeedbackStatus;
import com.chamapi.feedback.repository.AppFeedbackRepository;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import com.chamapi.file.service.S3FileService;
import com.chamapi.member.entity.Member;
import com.chamapi.member.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 앱 피드백({@link AppFeedback}) 비즈니스 로직. 시민 제출·조회 + 관리자 조회·처리를 한 서비스에서 다룬다
 * (형제 {@code ShelterInfoAppReportService}와 동일한 구성).
 *
 * <p>제출은 비로그인도 허용하므로 무인증 POST가 그대로 들어온다. 그래서 내용 길이와 첨부 개수 상한을
 * 여기서 검증하는 것이 유일한 방어선이다. 반대로 조회·수정·삭제는 작성자 본인만 가능하며,
 * 소유권은 {@code findByIdAndMemberId} 조회 자체로 검증한다.
 *
 * <p>스크린샷은 {@link FileType#FEEDBACK_IMAGE}로 구분해 {@code CommonFile.targetId}에 피드백 id를 심는 방식만 쓴다.
 * 카테고리·설명·승인 같은 이미지 메타가 없어 {@code ShelterImage}류의 조인 테이블을 만들지 않는다.
 * 대신 떼어낸 파일은 {@code targetId}가 남은 채 TEMPORARY로만 돌아가므로,
 * 조회할 때 반드시 COMPLETE만 걸러야 한다({@link #loadLinkedFiles}).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AppFeedbackService {

    private static final int CONTENT_MAX_LENGTH = 2000;
    private static final int IMAGE_MAX_COUNT = 5;

    private final AppFeedbackRepository appFeedbackRepository;
    private final CommonFileRepository commonFileRepository;
    private final MemberRepository memberRepository;
    private final S3FileService s3FileService;

    /**
     * 피드백 접수. {@code memberId}는 JWT가 있으면 채워지고 없으면 null(비로그인 제출).
     * 연결되지 않은 파일은 기존 일일 배치가 TEMPORARY 상태로 수거한다.
     */
    @Transactional
    public Long create(AppFeedbackCreateRequest request, Long memberId) {
        validate(request.content(), request.imageFileIds());

        AppFeedback saved = appFeedbackRepository.save(request.toEntity(memberId));

        List<Long> imageFileIds = request.imageFileIds();
        if (imageFileIds != null) {
            imageFileIds.stream()
                    .filter(Objects::nonNull)
                    .forEach(fileId -> s3FileService.markComplete(fileId, saved.getId()));
        }

        return saved.getId();
    }

    /** 내가 보낸 피드백 목록(최신순). 건수가 적어 페이지네이션 없이 전체를 준다(형제 제보 목록과 동일). */
    public List<AppFeedbackListResponse> findMyFeedbacks(Long memberId) {
        return appFeedbackRepository.findAllByMemberIdOrderByCreateDateDesc(memberId).stream()
                .map(AppFeedbackListResponse::from)
                .toList();
    }

    /** 내 피드백 상세. 본인 소유만 열람할 수 있고 관리자 메모는 내려주지 않는다. */
    public AppFeedbackDetailResponse getMyDetail(Long feedbackId, Long memberId) {
        AppFeedback feedback = findMyFeedback(feedbackId, memberId);
        return AppFeedbackDetailResponse.ofMine(feedback, resolveMemberName(feedback), loadImages(feedbackId));
    }

    /**
     * 내 피드백 수정. 본인 소유 + 접수(RECEIVED) 상태에서만 허용한다.
     * {@code imageFileIds}는 최종 상태 전체라 null이면 사진을 그대로 두고, 빈 배열이면 전부 떼어낸다.
     */
    @Transactional
    public void updateByMember(Long feedbackId, Long memberId, AppFeedbackUpdateRequest request) {
        AppFeedback feedback = findMyFeedback(feedbackId, memberId);
        feedback.verifyReceived();

        validate(request.content(), request.imageFileIds());
        feedback.updateByMember(request.category(), request.content(), request.contact());

        syncImages(feedbackId, request.imageFileIds());
    }

    /**
     * 내 피드백 삭제. 본인 소유 + 접수(RECEIVED) 상태에서만 허용한다.
     * 첨부는 TEMPORARY로 되돌리기만 하고 S3 실삭제는 기존 일일 배치가 맡는다.
     */
    @Transactional
    public void deleteByMember(Long feedbackId, Long memberId) {
        AppFeedback feedback = findMyFeedback(feedbackId, memberId);
        feedback.verifyReceived();

        loadLinkedFiles(feedbackId).forEach(CommonFile::modifyTemporaryFileStatus);
        appFeedbackRepository.delete(feedback);
    }

    /** 관리자 피드백 목록: 상태 필터(null이면 전체) + 페이지네이션. */
    public PageResponse<AppFeedbackListResponse> findFeedbacks(AppFeedbackStatus filter, Pageable pageable) {
        Page<AppFeedback> page = filter == null
                ? appFeedbackRepository.findAll(pageable)
                : appFeedbackRepository.findAllByStatus(filter, pageable);

        return PageResponse.from(page.map(AppFeedbackListResponse::from));
    }

    /** 관리자 피드백 상세 = 본문 + 작성자 이름 + 첨부 스크린샷(Presigned GET URL). */
    public AppFeedbackDetailResponse getDetail(Long feedbackId) {
        AppFeedback feedback = findFeedback(feedbackId);
        return AppFeedbackDetailResponse.of(feedback, resolveMemberName(feedback), loadImages(feedbackId));
    }

    /** 관리자 처리: 상태 전이 + 내부 메모. */
    @Transactional
    public void updateByAdmin(Long feedbackId, AppFeedbackAdminUpdateRequest request) {
        findFeedback(feedbackId).updateByAdmin(request.status(), request.adminNote());
    }

    /**
     * 회원 탈퇴 훅. MEMBER FK가 ON DELETE RESTRICT라 작성자 참조를 먼저 끊어야 탈퇴가 가능하고,
     * 피드백 내용 자체는 베타 기간 기록으로 남긴다.
     */
    @Transactional
    public void detachMember(Long memberId) {
        appFeedbackRepository.findAllByMemberIdOrderByCreateDateDesc(memberId).forEach(AppFeedback::detachMember);
    }

    /** 무인증 POST가 들어오는 경로라 접수·수정 양쪽에서 같은 상한을 건다. */
    private void validate(String content, List<Long> imageFileIds) {
        if (content == null || content.isBlank()) {
            throw new BadRequestException("피드백 내용을 입력해주세요");
        }
        if (content.length() > CONTENT_MAX_LENGTH) {
            throw new BadRequestException("피드백 내용은 " + CONTENT_MAX_LENGTH + "자까지 입력할 수 있습니다");
        }
        if (imageFileIds != null && imageFileIds.size() > IMAGE_MAX_COUNT) {
            throw new BadRequestException("사진은 최대 " + IMAGE_MAX_COUNT + "장까지 첨부할 수 있습니다");
        }
    }

    /** 첨부를 요청받은 최종 목록과 같아지도록 붙이고 뗀다. null이면 사진 미변경. */
    private void syncImages(Long feedbackId, List<Long> newFileIds) {
        if (newFileIds == null) {
            return;
        }

        List<CommonFile> current = loadLinkedFiles(feedbackId);
        Set<Long> targetIds = newFileIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        Set<Long> currentIds = current.stream().map(CommonFile::getId).collect(Collectors.toSet());

        current.stream()
                .filter(file -> !targetIds.contains(file.getId()))
                .forEach(CommonFile::modifyTemporaryFileStatus);

        targetIds.stream()
                .filter(fileId -> !currentIds.contains(fileId))
                .forEach(fileId -> s3FileService.markComplete(fileId, feedbackId));
    }

    /**
     * 이 피드백에 실제로 붙어 있는 파일. 떼어낸 파일도 {@code targetId}가 남아 있어
     * {@code findByTargetIdAndFileType}만으로는 걸러지지 않으므로 COMPLETE 상태로 한 번 더 거른다.
     */
    private List<CommonFile> loadLinkedFiles(Long feedbackId) {
        return commonFileRepository.findByTargetIdAndFileType(feedbackId, FileType.FEEDBACK_IMAGE).stream()
                .filter(file -> file.getFileStatus() == FileStatus.COMPLETE)
                .toList();
    }

    private List<AppFeedbackDetailResponse.ImageView> loadImages(Long feedbackId) {
        List<Long> fileIds = loadLinkedFiles(feedbackId).stream()
                .map(CommonFile::getId)
                .toList();

        return s3FileService.getFilesForView(fileIds).stream()
                .map(view -> new AppFeedbackDetailResponse.ImageView(
                        view.getFileId(),
                        view.getUrl(),
                        view.getFileName()
                ))
                .toList();
    }

    private String resolveMemberName(AppFeedback feedback) {
        return feedback.getMemberId() == null
                ? null
                : memberRepository.findById(feedback.getMemberId()).map(Member::getMemberName).orElse(null);
    }

    private AppFeedback findMyFeedback(Long feedbackId, Long memberId) {
        return appFeedbackRepository.findByIdAndMemberId(feedbackId, memberId)
                .orElseThrow(() -> new BadRequestException("본인 피드백이 아니거나 존재하지 않습니다"));
    }

    private AppFeedback findFeedback(Long feedbackId) {
        return appFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 피드백 ID: " + feedbackId));
    }
}

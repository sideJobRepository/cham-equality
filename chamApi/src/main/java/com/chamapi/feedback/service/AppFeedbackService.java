package com.chamapi.feedback.service;

import com.chamapi.common.dto.PageResponse;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.feedback.dto.request.AppFeedbackAdminUpdateRequest;
import com.chamapi.feedback.dto.request.AppFeedbackCreateRequest;
import com.chamapi.feedback.dto.response.AppFeedbackDetailResponse;
import com.chamapi.feedback.dto.response.AppFeedbackListResponse;
import com.chamapi.feedback.entity.AppFeedback;
import com.chamapi.feedback.enums.AppFeedbackStatus;
import com.chamapi.feedback.repository.AppFeedbackRepository;
import com.chamapi.file.dto.response.FileViewResponse;
import com.chamapi.file.entity.CommonFile;
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

/**
 * 앱 피드백({@link AppFeedback}) 비즈니스 로직. 시민 제출 + 관리자 조회·처리를 한 서비스에서 다룬다
 * (형제 {@code ShelterInfoAppReportService}와 동일한 구성).
 *
 * <p>제출은 비로그인도 허용하므로 무인증 POST가 그대로 들어온다. 그래서 내용 길이와 첨부 개수 상한을
 * 여기서 검증하는 것이 유일한 방어선이다.
 *
 * <p>스크린샷은 {@link FileType#FEEDBACK_IMAGE}로 구분해 {@code CommonFile.targetId}에 피드백 id를 심는 방식만 쓴다.
 * 카테고리·설명·승인 같은 이미지 메타가 없어 {@code ShelterImage}류의 조인 테이블을 만들지 않는다.
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
        String content = request.content();
        if (content == null || content.isBlank()) {
            throw new BadRequestException("피드백 내용을 입력해주세요");
        }
        if (content.length() > CONTENT_MAX_LENGTH) {
            throw new BadRequestException("피드백 내용은 " + CONTENT_MAX_LENGTH + "자까지 입력할 수 있습니다");
        }

        List<Long> imageFileIds = request.imageFileIds();
        if (imageFileIds != null && imageFileIds.size() > IMAGE_MAX_COUNT) {
            throw new BadRequestException("사진은 최대 " + IMAGE_MAX_COUNT + "장까지 첨부할 수 있습니다");
        }

        AppFeedback saved = appFeedbackRepository.save(request.toEntity(memberId));

        if (imageFileIds != null) {
            imageFileIds.stream()
                    .filter(Objects::nonNull)
                    .forEach(fileId -> s3FileService.markComplete(fileId, saved.getId()));
        }

        return saved.getId();
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

        String memberName = feedback.getMemberId() == null
                ? null
                : memberRepository.findById(feedback.getMemberId()).map(Member::getMemberName).orElse(null);

        List<Long> fileIds = commonFileRepository.findByTargetIdAndFileType(feedbackId, FileType.FEEDBACK_IMAGE)
                .stream()
                .map(CommonFile::getId)
                .toList();

        List<AppFeedbackDetailResponse.ImageView> images = s3FileService.getFilesForView(fileIds).stream()
                .map(view -> new AppFeedbackDetailResponse.ImageView(
                        view.getFileId(),
                        view.getUrl(),
                        view.getFileName()
                ))
                .toList();

        return AppFeedbackDetailResponse.of(feedback, memberName, images);
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
        appFeedbackRepository.findAllByMemberId(memberId).forEach(AppFeedback::detachMember);
    }

    private AppFeedback findFeedback(Long feedbackId) {
        return appFeedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 피드백 ID: " + feedbackId));
    }
}

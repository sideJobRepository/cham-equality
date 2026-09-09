package com.chamapi.feedback.dto.request;

import com.chamapi.feedback.entity.AppFeedback;
import com.chamapi.feedback.enums.AppFeedbackCategory;
import com.chamapi.feedback.enums.AppFeedbackStatus;

import java.util.List;

/**
 * 앱 피드백 제출 요청. 작성자는 요청 본문으로 받지 않고 JWT에서 추출한 {@code memberId}로 채운다(토큰 없으면 null).
 *
 * <p>{@code appVersion}·{@code platform}·{@code osVersion}·{@code deviceModel}은 버그 재현용으로 앱이 자동 수집해 넣는다.
 * {@code screen}은 피드백을 작성한 화면 이름(선택).
 * {@code imageFileIds}는 {@code fileType=FEEDBACK_IMAGE}로 presigned 업로드·등록을 끝낸 파일 id 목록이다.
 */
public record AppFeedbackCreateRequest(
        AppFeedbackCategory category,
        String content,
        String contact,
        String appVersion,
        String platform,
        String osVersion,
        String deviceModel,
        String screen,
        List<Long> imageFileIds
) {

    public AppFeedback toEntity(Long memberId) {
        return AppFeedback.builder()
                .memberId(memberId)
                .category(category != null ? category : AppFeedbackCategory.ETC)
                .content(content)
                .contact(contact)
                .status(AppFeedbackStatus.RECEIVED)
                .appVersion(appVersion)
                .platform(platform)
                .osVersion(osVersion)
                .deviceModel(deviceModel)
                .screen(screen)
                .build();
    }
}

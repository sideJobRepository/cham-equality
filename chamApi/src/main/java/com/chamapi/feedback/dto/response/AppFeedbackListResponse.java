package com.chamapi.feedback.dto.response;

import com.chamapi.feedback.entity.AppFeedback;
import com.chamapi.feedback.enums.AppFeedbackCategory;
import com.chamapi.feedback.enums.AppFeedbackStatus;

import java.time.LocalDateTime;

public record AppFeedbackListResponse(
        Long id,
        Long memberId,
        AppFeedbackCategory category,
        String content,
        AppFeedbackStatus status,
        String appVersion,
        String platform,
        LocalDateTime createDate
) {
    public static AppFeedbackListResponse from(AppFeedback f) {
        return new AppFeedbackListResponse(
                f.getId(),
                f.getMemberId(),
                f.getCategory(),
                f.getContent(),
                f.getStatus(),
                f.getAppVersion(),
                f.getPlatform(),
                f.getCreateDate()
        );
    }
}

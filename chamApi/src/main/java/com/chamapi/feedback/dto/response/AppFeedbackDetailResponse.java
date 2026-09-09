package com.chamapi.feedback.dto.response;

import com.chamapi.feedback.entity.AppFeedback;
import com.chamapi.feedback.enums.AppFeedbackCategory;
import com.chamapi.feedback.enums.AppFeedbackStatus;

import java.time.LocalDateTime;
import java.util.List;

public record AppFeedbackDetailResponse(
        Long id,
        Long memberId,
        String memberName,
        AppFeedbackCategory category,
        String content,
        String contact,
        AppFeedbackStatus status,
        String adminNote,
        String appVersion,
        String platform,
        String osVersion,
        String deviceModel,
        String screen,
        LocalDateTime createDate,
        LocalDateTime modifyDate,
        List<ImageView> images
) {

    public record ImageView(Long fileId, String url, String fileName) {}

    public static AppFeedbackDetailResponse of(AppFeedback f, String memberName, List<ImageView> images) {
        return new AppFeedbackDetailResponse(
                f.getId(),
                f.getMemberId(),
                memberName,
                f.getCategory(),
                f.getContent(),
                f.getContact(),
                f.getStatus(),
                f.getAdminNote(),
                f.getAppVersion(),
                f.getPlatform(),
                f.getOsVersion(),
                f.getDeviceModel(),
                f.getScreen(),
                f.getCreateDate(),
                f.getModifyDate(),
                images
        );
    }
}

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

    /**
     * 작성자 본인에게 내려줄 상세. {@code adminNote}는 관리자 내부 메모라 항상 null로 비운다
     * (관리자 답변을 앱에 보여주기로 하면 여기만 바꾸면 된다).
     */
    public static AppFeedbackDetailResponse ofMine(AppFeedback f, String memberName, List<ImageView> images) {
        AppFeedbackDetailResponse full = of(f, memberName, images);
        return new AppFeedbackDetailResponse(
                full.id(), full.memberId(), full.memberName(), full.category(), full.content(),
                full.contact(), full.status(), null, full.appVersion(), full.platform(),
                full.osVersion(), full.deviceModel(), full.screen(), full.createDate(),
                full.modifyDate(), full.images()
        );
    }

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

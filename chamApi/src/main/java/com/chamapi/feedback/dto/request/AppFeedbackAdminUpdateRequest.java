package com.chamapi.feedback.dto.request;

import com.chamapi.feedback.enums.AppFeedbackStatus;

/**
 * 관리자 피드백 처리 요청. status가 null이면 상태는 유지하고 메모만 갱신한다.
 */
public record AppFeedbackAdminUpdateRequest(
        AppFeedbackStatus status,
        String adminNote
) {}

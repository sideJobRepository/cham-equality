package com.chamapi.feedback.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 앱 피드백 처리 상태. 접수 시 RECEIVED로 시작하고 관리자 웹에서만 전이한다(시민은 바꿀 수 없다).
 */
@RequiredArgsConstructor
@Getter
public enum AppFeedbackStatus {

    RECEIVED("접수"),
    IN_PROGRESS("확인중"),
    RESOLVED("완료");

    private final String value;

}

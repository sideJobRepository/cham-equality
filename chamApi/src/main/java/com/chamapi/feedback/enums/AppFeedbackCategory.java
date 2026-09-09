package com.chamapi.feedback.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 앱 피드백 분류. 테스터가 앱에서 고르는 값이라 화면 라벨은 앱 i18n이 가지고, 여기 value는 관리자 웹·로그용 한국어다.
 */
@RequiredArgsConstructor
@Getter
public enum AppFeedbackCategory {

    BUG("오류/버그"),
    IMPROVEMENT("개선 제안"),
    SHELTER_DATA("대피소 정보 오류"),
    CONTENT("콘텐츠/번역 오류"),
    ETC("기타");

    private final String value;

}

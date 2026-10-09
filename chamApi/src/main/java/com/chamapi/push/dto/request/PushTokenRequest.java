package com.chamapi.push.dto.request;

/**
 * 푸시 토큰 등록/해제 요청.
 * {@code platform}은 android/ios, {@code language}는 앱 언어 코드(ko/en/zh/ja/vi). 해제 때는 {@code token}만 쓴다.
 * {@code disasterEnabled}·{@code personalEnabled}는 앱 알림 설정 토글. 안 보내면(null) 기존 값을 유지하고, 새 기기면 켜짐.
 */
public record PushTokenRequest(
        String token,
        String platform,
        String language,
        Boolean disasterEnabled,
        Boolean personalEnabled
) {
    /** 해제·관리자 테스트처럼 토큰만 필요한 곳용. */
    public PushTokenRequest(String token, String platform, String language) {
        this(token, platform, language, null, null);
    }
}

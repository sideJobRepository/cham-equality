package com.chamapi.security.service.social;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum LoginRequestSocialLoginUrl {

    KAKAO("/api/kakao-login"),
    NAVER("/api/naver-login"),
    APP_KAKAO("/api/app/kakao-login"),
    APP_NAVER("/api/app/naver-login");

    private final String path;

    public static LoginRequestSocialLoginUrl getSocialType(String uri) {
        return Arrays.stream(LoginRequestSocialLoginUrl.values()).filter(type -> type.path.equals(uri))
                .findFirst().orElseThrow(() -> new IllegalArgumentException("존재 하지 않는 소셜 로그인 입니다."));
    }

    public boolean isApp() {
        return this == APP_KAKAO || this == APP_NAVER;
    }
}

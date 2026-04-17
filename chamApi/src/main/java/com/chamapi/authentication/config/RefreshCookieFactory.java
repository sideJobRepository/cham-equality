package com.chamapi.authentication.config;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Component
@RequiredArgsConstructor
public class RefreshCookieFactory {

    private final AuthProperties authProperties;

    public ResponseCookie create(String tokenValue) {
        return build(tokenValue, authProperties.getRefreshToken().getExpiry());
    }

    public ResponseCookie expire() {
        return build("", Duration.ZERO);
    }

    private ResponseCookie build(String value, Duration maxAge) {
        AuthProperties.Cookie cookie = authProperties.getCookie();
        return ResponseCookie.from(cookie.getName(), value)
                .httpOnly(true)
                .secure(cookie.isSecure())
                .path(cookie.getPath())
                .maxAge(maxAge)
                .sameSite(cookie.getSameSite())
                .build();
    }
}

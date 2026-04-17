package com.chamapi.security.service;


import com.chamapi.security.dto.response.AccessTokenResponse;
import com.chamapi.security.service.social.SocialProfile;

public interface SocialService {
    AccessTokenResponse getAccessToken(String code, String socialType);
    SocialProfile getProfile(String accessToken);

    /**
     * 앱 SDK로 받은 access token이 내 앱에서 발급된 게 맞는지 검증한다.
     * 기본 구현은 no-op. 필요한 서비스에서 override.
     */
    default void verifyAccessToken(String accessToken) {
    }
}

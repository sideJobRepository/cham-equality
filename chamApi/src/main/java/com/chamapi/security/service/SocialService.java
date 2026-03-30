package com.chamapi.security.service;


import com.chamapi.security.service.response.AccessTokenResponse;
import com.chamapi.security.service.social.SocialProfile;

public interface SocialService {
    AccessTokenResponse getAccessToken(String code, String socialType);
    SocialProfile getProfile(String accessToken);
}

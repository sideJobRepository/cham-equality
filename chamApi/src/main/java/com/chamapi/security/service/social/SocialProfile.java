package com.chamapi.security.service.social;


public record SocialProfile(
        LoginRequestSocialType provider,      // KAKAO / NAVER / GOOGLE
        String sub,               // 공급자 고유 ID
        String email,
        String name,
        String phone
) {}


package com.chamapi.security.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SocialAuthenticationRequest {

    private String code;
    private String accessToken;
    private String name;   // 애플 최초 로그인 시에만 앱이 SDK에서 받아 함께 전달(다른 소셜은 무시됨)
}

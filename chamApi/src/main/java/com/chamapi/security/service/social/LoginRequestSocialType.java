package com.chamapi.security.service.social;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum LoginRequestSocialType {

    KAKAO("카카오"),
    NAVER("네이버");
    
    private final String value;
   
}

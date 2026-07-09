package com.chamapi.member.enums;


import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum SocialType {

    KAKAO("카카오"),
    NAVER("네이버"),
    APPLE("애플");
    
    private final String value;
}

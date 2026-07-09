package com.chamapi.authentication.dto;

import com.chamapi.member.dto.MemberResponseDto;

public record TokenResponse(String token, MemberResponseDto user, String refreshToken) {

    // 웹(쿠키 방식)은 refresh를 body에 담지 않는다. 앱만 3-arg로 refresh를 함께 내려준다.
    public TokenResponse(String token, MemberResponseDto user) {
        this(token, user, null);
    }
}

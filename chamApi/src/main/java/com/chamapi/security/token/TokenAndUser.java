package com.chamapi.security.token;


import com.chamapi.security.dto.MemberResponseDto;

// 토큰 + 유저 응답용
public record TokenAndUser(TokenPair token, MemberResponseDto user) {}


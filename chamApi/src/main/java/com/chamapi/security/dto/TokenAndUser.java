package com.chamapi.security.dto;


import com.chamapi.security.handler.TokenPair;

// 토큰 + 유저 응답용
public record TokenAndUser(TokenPair token, MemberResponseDto user) {}


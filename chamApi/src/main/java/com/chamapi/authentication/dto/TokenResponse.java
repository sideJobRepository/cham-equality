package com.chamapi.authentication.dto;

import com.chamapi.security.dto.MemberResponseDto;

public record TokenResponse(String token, MemberResponseDto user) {
}

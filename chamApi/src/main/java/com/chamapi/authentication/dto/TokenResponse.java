package com.chamapi.authentication.dto;

import com.chamapi.member.dto.MemberResponseDto;

public record TokenResponse(String token, MemberResponseDto user) {
}

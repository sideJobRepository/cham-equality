package com.chamapi.member.controller;

import com.chamapi.common.dto.ApiResponse;
import com.chamapi.common.exception.UnauthorizedException;
import com.chamapi.member.service.MemberService;
import com.chamapi.util.JwtParserUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 앱 회원 계정 API. 현재는 회원 탈퇴(계정삭제)만 제공한다.
 * 회원은 JWT의 {@code id} 클레임으로 식별하며 토큰이 없으면 401.
 */
@RestController
@RequestMapping("/api/app/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;

    /** 회원 탈퇴. 본인 계정 + 관련 데이터(앱 제보/권한/refresh)를 삭제한다. */
    @DeleteMapping
    public ApiResponse<Void> withdraw(@AuthenticationPrincipal Jwt jwt) {
        Long memberId = JwtParserUtil.extractMemberId(jwt);
        if (memberId == null) {
            throw new UnauthorizedException("로그인이 필요합니다");
        }
        memberService.withdraw(memberId);
        return ApiResponse.of(200, true, "회원 탈퇴 완료");
    }
}

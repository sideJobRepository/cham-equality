package com.chamapi.authentication.controller;


import com.chamapi.common.dto.ApiResponse;
import com.chamapi.authentication.config.RefreshCookieFactory;
import com.chamapi.authentication.dto.TokenResponse;
import com.chamapi.authentication.service.RefreshTokenService;
import com.chamapi.security.token.TokenAndUser;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 토큰 재발급 / 로그아웃 API.
 * Refresh 토큰은 HttpOnly 쿠키에 담아 주고받는다(쿠키 이름은 {@code auth.cookie.name}).
 * Access 토큰은 응답 JSON에만 실리며 쿠키로 내려주지 않는다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class RefreshTokenController {

    private final RefreshTokenService refreshTokenService;
    private final RefreshCookieFactory refreshCookieFactory;

    /**
     * 토큰 재발급. 유효한 refresh 쿠키를 받아 새 access+refresh 쌍을 만들고,
     * 새 refresh는 Set-Cookie로 덮어 쓴다(회전). access는 응답 본문으로 돌려준다.
     */
    @PostMapping("/refresh")
    public TokenResponse refreshToken(@CookieValue(value = "${auth.cookie.name:refreshToken}", required = false) String refreshToken, HttpServletResponse response) {
        TokenAndUser tokenPair = refreshTokenService.reissueTokenWithUser(refreshToken);
        response.addHeader("Set-Cookie", refreshCookieFactory.create(tokenPair.token().getRefreshToken()).toString());
        return new TokenResponse(tokenPair.token().getAccessToken(), tokenPair.user());
    }

    /**
     * 로그아웃. DB의 refresh row를 지우고(있으면) 쿠키를 즉시 만료시킨다.
     * 쿠키가 이미 없던 요청도 200을 돌려준다(클라 정리만 수행).
     */
    @DeleteMapping("/refresh")
    public ApiResponse<Void> deleteRefreshToken(@CookieValue(value = "${auth.cookie.name:refreshToken}", required = false) String refreshToken, HttpServletResponse response) {
        ApiResponse<Void> apiResponse = refreshToken == null
                ? ApiResponse.of(200, true, "정상 삭제")
                : refreshTokenService.deleteRefresh(refreshToken);
        response.addHeader("Set-Cookie", refreshCookieFactory.expire().toString());
        return apiResponse;
    }
}

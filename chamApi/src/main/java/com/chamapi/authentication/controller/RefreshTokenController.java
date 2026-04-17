package com.chamapi.authentication.controller;


import com.chamapi.common.dto.ApiResponse;
import com.chamapi.authentication.config.RefreshCookieFactory;
import com.chamapi.authentication.dto.TokenResponse;
import com.chamapi.authentication.service.RefreshTokenService;
import com.chamapi.security.token.TokenAndUser;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class RefreshTokenController {

    private final RefreshTokenService refreshTokenService;
    private final RefreshCookieFactory refreshCookieFactory;

    @PostMapping("/refresh")
    public TokenResponse refreshToken(@CookieValue(value = "${auth.cookie.name:refreshToken}", required = false) String refreshToken, HttpServletResponse response) {
        TokenAndUser tokenPair = refreshTokenService.reissueTokenWithUser(refreshToken);
        response.addHeader("Set-Cookie", refreshCookieFactory.create(tokenPair.token().getRefreshToken()).toString());
        return new TokenResponse(tokenPair.token().getAccessToken(), tokenPair.user());
    }

    @DeleteMapping("/refresh")
    public ApiResponse<Void> deleteRefreshToken(@CookieValue(value = "${auth.cookie.name:refreshToken}", required = false) String refreshToken, HttpServletResponse response) {
        ApiResponse<Void> apiResponse = refreshToken == null
                ? ApiResponse.of(200, true, "정상 삭제")
                : refreshTokenService.deleteRefresh(refreshToken);
        response.addHeader("Set-Cookie", refreshCookieFactory.expire().toString());
        return apiResponse;
    }
}

package com.chamapi.refresh.contoller;


import com.chamapi.common.dto.ApiResponse;
import com.chamapi.refresh.service.RefreshTokenService;
import com.chamapi.security.token.TokenAndUser;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class RefreshTokenController {
    
    private final RefreshTokenService refreshTokenService;
    
    
    @Value("${cookie.secure}")
    private boolean secure;
    
    @PostMapping("/refresh")
    public Map<String, Object> refreshToken(@CookieValue(value = "refreshToken", required = false) String refreshToken
         , HttpServletResponse response
    ) {
        if(refreshToken == null) {
            return null;
        }
        TokenAndUser tokenPair = refreshTokenService.reissueTokenWithUser(refreshToken);
        if(tokenPair == null) {
            return null;
        }
        ResponseCookie newRefreshCookie = ResponseCookie.from("refreshToken", tokenPair.token().getRefreshToken())
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(Duration.ofDays(1))
                .sameSite("Strict")
                .build();
        response.addHeader("Set-Cookie", newRefreshCookie.toString());
        return Map.of(
                "token", tokenPair.token().getAccessToken(),
                "user", tokenPair.user()
        );
    }
    
    @DeleteMapping("/refresh")
    public ApiResponse deleteRefreshToken(@CookieValue(value = "refreshToken", required = false) String refreshToken
            , HttpServletResponse response) {
        if (refreshToken == null) {
            return null;
        }
        ApiResponse apiResponse = refreshTokenService.deleteRefresh(refreshToken);
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .maxAge(0) // 삭제
                .sameSite("Strict")
                .build();
        response.addHeader("Set-Cookie", deleteCookie.toString());
        return apiResponse;
    }
}

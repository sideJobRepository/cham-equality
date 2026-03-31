package com.chamapi.security.handler;



import com.chamapi.member.entity.Member;
import com.chamapi.refresh.service.RefreshTokenService;
import com.chamapi.security.dto.MemberResponseDto;
import com.chamapi.security.jwt.RsaSecuritySigner;
import com.chamapi.security.token.SocialAuthenticationToken;
import com.chamapi.security.token.TokenPair;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWK;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Component(value = "chamEqualityAuthenticationSuccessHandler")
@RequiredArgsConstructor
public class ChamEqualityAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    
    private final JsonMapper jsonMapper;
    private final RsaSecuritySigner rsaSecuritySigner;
    private final RefreshTokenService refreshTokenService;
    private final JWK jwk;
    @Value("${cookie.secure}")
    private boolean secure;

    
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        SocialAuthenticationToken token = (SocialAuthenticationToken) authentication;
        Member member = (Member) token.getPrincipal();
        List<GrantedAuthority> authorities = (List<GrantedAuthority>) token.getAuthorities();
        
        LocalDateTime expiresAt = LocalDateTime.now().plusDays(1);
        
        try {
            TokenPair tokenPair = rsaSecuritySigner.getToken(member, jwk, authorities);
            refreshTokenService.refreshTokenSaveOrUpdate(member, tokenPair.getRefreshToken(), expiresAt);
            
            MemberResponseDto memberResponseDto = MemberResponseDto.create(member, authorities);
            // Access Token은 응답 JSON에 포함
            Map<String, Object> result = Map.of(
                    "user", memberResponseDto,
                    "token", tokenPair.getAccessToken()
            );
            
            // Refresh Token은 HttpOnly 쿠키로 설정
            ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenPair.getRefreshToken())
                    .httpOnly(true)
                    .secure(secure) // 로컬일 경우 secure=false
                    .path("/")
                    .maxAge(Duration.ofDays(1))
                    .sameSite("Strict")
                    .build();
            response.addHeader("Set-Cookie", refreshCookie.toString());
            response.setContentType("application/json; charset=UTF-8");
            response.getWriter().write(jsonMapper.writeValueAsString(result));
        } catch (JOSEException e) {
            throw new RuntimeException("JWT 생성 실패", e);
        }
    }
}

package com.chamapi.security.handler;



import com.chamapi.member.entity.Member;
import com.chamapi.authentication.config.RefreshCookieFactory;
import com.chamapi.authentication.dto.TokenResponse;
import com.chamapi.authentication.exception.JwtGenerationException;
import com.chamapi.authentication.service.RefreshTokenService;
import com.chamapi.member.dto.MemberResponseDto;
import com.chamapi.security.jwt.RsaSecuritySigner;
import com.chamapi.security.token.SocialAuthenticationToken;
import com.chamapi.security.token.TokenPair;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.JWK;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.util.List;

@Component(value = "chamEqualityAuthenticationSuccessHandler")
@RequiredArgsConstructor
public class ChamEqualityAuthenticationSuccessHandler implements AuthenticationSuccessHandler {
    
    private final JsonMapper jsonMapper;
    private final RsaSecuritySigner rsaSecuritySigner;
    private final RefreshTokenService refreshTokenService;
    private final JWK jwk;
    private final RefreshCookieFactory refreshCookieFactory;


    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        SocialAuthenticationToken token = (SocialAuthenticationToken) authentication;
        Member member = (Member) token.getPrincipal();
        List<GrantedAuthority> authorities = (List<GrantedAuthority>) token.getAuthorities();

        try {
            TokenPair tokenPair = rsaSecuritySigner.getToken(member, jwk, authorities);
            refreshTokenService.refreshTokenSaveOrUpdate(member, tokenPair.getRefreshToken());

            MemberResponseDto memberResponseDto = MemberResponseDto.create(member, authorities);
            TokenResponse result = new TokenResponse(tokenPair.getAccessToken(), memberResponseDto);

            // Refresh Token은 HttpOnly 쿠키로 설정
            response.addHeader("Set-Cookie", refreshCookieFactory.create(tokenPair.getRefreshToken()).toString());
            response.setContentType("application/json; charset=UTF-8");
            response.getWriter().write(jsonMapper.writeValueAsString(result));
        } catch (JOSEException e) {
            throw new JwtGenerationException("JWT 생성 실패", e);
        }
    }
}

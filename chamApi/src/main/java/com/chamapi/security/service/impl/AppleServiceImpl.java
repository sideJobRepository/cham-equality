package com.chamapi.security.service.impl;


import com.chamapi.security.dto.response.AccessTokenResponse;
import com.chamapi.security.service.SocialService;
import com.chamapi.security.service.social.LoginRequestSocialType;
import com.chamapi.security.service.social.SocialProfile;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Service;

/**
 * 애플 앱 로그인.
 * 카카오/네이버와 달리 앱 SDK가 주는 것은 access token이 아니라
 * 애플이 서명한 identityToken(JWT)이다. 별도 프로필 API가 없고 신원 정보(sub/email)가
 * 토큰 안에 들어 있어서, 애플 공개키(JWKS)로 서명·issuer·audience만 검증하면 된다.
 */
@Service("appleService")
@RequiredArgsConstructor
public class AppleServiceImpl implements SocialService {

    @Value("${apple.issuer:https://appleid.apple.com}")
    private String appleIssuer;
    @Value("${apple.jwks-uri:https://appleid.apple.com/auth/keys}")
    private String appleJwksUri;
    @Value("${apple.client-id:test}")
    private String appleClientId;

    private JwtDecoder jwtDecoder;

    @PostConstruct
    void init() {
        NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(appleJwksUri).build();
        decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(appleIssuer));
        this.jwtDecoder = decoder;
    }

    /**
     * 애플은 앱 identityToken 로그인만 지원한다(웹 인가코드 교환 경로 없음).
     */
    @Override
    public AccessTokenResponse getAccessToken(String code, String socialType) {
        throw new UnsupportedOperationException("애플은 앱 identityToken 로그인만 지원합니다.");
    }

    @Override
    public SocialProfile getProfile(String identityToken) {
        Jwt jwt = decode(identityToken);
        return new SocialProfile(
                LoginRequestSocialType.APPLE,
                jwt.getSubject(),
                jwt.getClaimAsString("email"),
                null,   // 이름은 애플 최초 로그인 때만 클라이언트로 전달됨(토큰에 없음)
                null
        );
    }

    /**
     * 앱 SDK가 준 identityToken이 내 애플 앱에서 발급된 유효한 토큰인지 검증.
     * 서명·issuer·만료는 NimbusJwtDecoder가, audience(Bundle ID)는 여기서 확인한다.
     */
    @Override
    public void verifyAccessToken(String identityToken) {
        decode(identityToken);
    }

    private Jwt decode(String identityToken) {
        Jwt jwt;
        try {
            jwt = jwtDecoder.decode(identityToken);
        } catch (JwtException e) {
            throw new BadCredentialsException("유효하지 않은 애플 토큰입니다.", e);
        }
        if (!jwt.getAudience().contains(appleClientId)) {
            throw new BadCredentialsException("이 앱에서 발급된 애플 토큰이 아닙니다.");
        }
        return jwt;
    }
}

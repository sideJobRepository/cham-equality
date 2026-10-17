package com.chamapi.security.service.impl;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.security.service.AppleRevokeService;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.interfaces.ECPrivateKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.util.Base64;
import java.util.Date;

/**
 * 애플 토큰 철회. 백엔드는 애플 refresh token을 보관하지 않으므로
 * 탈퇴 시점에 앱이 새로 받은 authorizationCode를 /auth/token 으로 교환하고 곧바로 /auth/revoke 한다.
 * 두 호출 모두 client_secret 이 필요한데, 애플 정책상 이 값은 Sign in with Apple 키(.p8)로
 * 서명한 ES256 JWT다(최대 6개월 유효 — 여기서는 매번 5분짜리를 새로 만든다).
 */
@Slf4j
@Service
public class AppleRevokeServiceImpl implements AppleRevokeService {

    private static final String AUDIENCE = "https://appleid.apple.com";
    private static final long CLIENT_SECRET_TTL_MILLIS = 1000L * 60 * 5;

    @Value("${apple.client-id:test}")
    private String clientId;
    @Value("${apple.team-id:}")
    private String teamId;
    @Value("${apple.key-id:}")
    private String keyId;
    @Value("${apple.private-key-base64:}")
    private String privateKeyBase64;
    @Value("${apple.token-uri:https://appleid.apple.com/auth/token}")
    private String tokenUri;
    @Value("${apple.revoke-uri:https://appleid.apple.com/auth/revoke}")
    private String revokeUri;

    @Override
    public void revokeByAuthorizationCode(String authorizationCode) {
        if (!StringUtils.hasText(authorizationCode)) {
            throw new BadRequestException("애플 계정 확인이 필요합니다.");
        }
        String clientSecret = createClientSecret();

        MultiValueMap<String, String> tokenParams = new LinkedMultiValueMap<>();
        tokenParams.add("grant_type", "authorization_code");
        tokenParams.add("code", authorizationCode);
        tokenParams.add("client_id", clientId);
        tokenParams.add("client_secret", clientSecret);

        AppleTokenResponse tokenResponse;
        try {
            tokenResponse = RestClient.create().post()
                    .uri(tokenUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(tokenParams)
                    .retrieve()
                    .body(AppleTokenResponse.class);
        } catch (RestClientException e) {
            log.warn("애플 authorizationCode 교환 실패", e);
            throw new BadRequestException("애플 계정 확인에 실패했습니다. 다시 시도해 주세요.");
        }

        // refresh token 철회가 앱 연결을 완전히 끊는다. 혹시 안 오면 access token이라도 철회.
        boolean hasRefreshToken = tokenResponse != null && StringUtils.hasText(tokenResponse.getRefreshToken());
        String token = hasRefreshToken ? tokenResponse.getRefreshToken()
                : tokenResponse == null ? null : tokenResponse.getAccessToken();
        if (!StringUtils.hasText(token)) {
            throw new BadRequestException("애플 계정 확인에 실패했습니다. 다시 시도해 주세요.");
        }

        MultiValueMap<String, String> revokeParams = new LinkedMultiValueMap<>();
        revokeParams.add("client_id", clientId);
        revokeParams.add("client_secret", clientSecret);
        revokeParams.add("token", token);
        revokeParams.add("token_type_hint", hasRefreshToken ? "refresh_token" : "access_token");

        try {
            RestClient.create().post()
                    .uri(revokeUri)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(revokeParams)
                    .retrieve()
                    .toBodilessEntity();
        } catch (RestClientException e) {
            log.warn("애플 토큰 철회 실패", e);
            throw new BadRequestException("애플 계정 연결 해제에 실패했습니다. 다시 시도해 주세요.");
        }
    }

    private String createClientSecret() {
        if (!StringUtils.hasText(teamId) || !StringUtils.hasText(keyId) || !StringUtils.hasText(privateKeyBase64)) {
            // 키 미등록 상태에서 DB만 지우고 애플 연결이 남는 일이 없게 탈퇴 자체를 막는다.
            throw new IllegalStateException("애플 토큰 철회 설정(apple.team-id/key-id/private-key-base64)이 없습니다.");
        }
        long now = System.currentTimeMillis();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(teamId)
                .issueTime(new Date(now))
                .expirationTime(new Date(now + CLIENT_SECRET_TTL_MILLIS))
                .audience(AUDIENCE)
                .subject(clientId)
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader.Builder(JWSAlgorithm.ES256).keyID(keyId).build(), claims);
        try {
            jwt.sign(new ECDSASigner(readPrivateKey()));
        } catch (JOSEException e) {
            throw new IllegalStateException("애플 client_secret 서명에 실패했습니다.", e);
        }
        return jwt.serialize();
    }

    /** 시크릿은 .p8 파일(PEM) 전체를 base64 한 값. PEM 머리·꼬리를 떼고 PKCS8로 읽는다. */
    private ECPrivateKey readPrivateKey() {
        try {
            String pem = new String(Base64.getDecoder().decode(privateKeyBase64.trim()), StandardCharsets.UTF_8);
            String body = pem
                    .replace("-----BEGIN PRIVATE KEY-----", "")
                    .replace("-----END PRIVATE KEY-----", "")
                    .replaceAll("\\s", "");
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(Base64.getDecoder().decode(body));
            return (ECPrivateKey) KeyFactory.getInstance("EC").generatePrivate(spec);
        } catch (IllegalArgumentException | GeneralSecurityException | ClassCastException e) {
            throw new IllegalStateException("애플 개인키(apple.private-key-base64)를 읽을 수 없습니다.", e);
        }
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class AppleTokenResponse {
        @JsonProperty("access_token")
        private String accessToken;
        @JsonProperty("refresh_token")
        private String refreshToken;
    }
}

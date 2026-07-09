package com.chamapi.security.service.impl;

import com.chamapi.security.service.social.LoginRequestSocialType;
import com.chamapi.security.service.social.SocialProfile;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.KeyUse;
import com.nimbusds.jose.jwk.RSAKey;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 애플 identityToken 검증 단위 테스트.
 * 실제 애플 서명 토큰을 만들 수 없으므로 테스트용 RSA 키페어로 직접 서명하고,
 * 그 공개키 JWKS를 JDK 내장 HttpServer로 띄워 decoder가 검증하게 한다.
 */
class AppleServiceImplTest {

    private static final String ISSUER = "https://appleid.apple.com";
    private static final String CLIENT_ID = "or.cham.equality";

    private static HttpServer server;
    private static String jwksUri;
    private static RSAKey signingKey;      // JWKS로 공개되는 정상 키(개인키 포함)
    private static RSAKey rogueKey;        // JWKS에 없는 위조용 키

    @BeforeAll
    static void setUp() throws Exception {
        signingKey = generateRsaKey("apple-test-key");
        rogueKey = generateRsaKey("rogue-key");

        String jwksJson = new JWKSet(signingKey.toPublicJWK()).toString();

        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/keys", exchange -> {
            byte[] body = jwksJson.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.start();
        jwksUri = "http://127.0.0.1:" + server.getAddress().getPort() + "/keys";
    }

    @AfterAll
    static void tearDown() {
        server.stop(0);
    }

    private static RSAKey generateRsaKey(String kid) throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
        generator.initialize(2048);
        KeyPair keyPair = generator.generateKeyPair();
        return new RSAKey.Builder((RSAPublicKey) keyPair.getPublic())
                .privateKey((RSAPrivateKey) keyPair.getPrivate())
                .keyID(kid)
                .keyUse(KeyUse.SIGNATURE)
                .algorithm(JWSAlgorithm.RS256)
                .build();
    }

    private AppleServiceImpl newService() {
        AppleServiceImpl service = new AppleServiceImpl();
        ReflectionTestUtils.setField(service, "appleIssuer", ISSUER);
        ReflectionTestUtils.setField(service, "appleJwksUri", jwksUri);
        ReflectionTestUtils.setField(service, "appleClientId", CLIENT_ID);
        ReflectionTestUtils.invokeMethod(service, "init");
        return service;
    }

    private String sign(RSAKey key, String issuer, String audience, Instant expiry) throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .audience(audience)
                .subject("apple-sub-001")
                .claim("email", "user@privaterelay.appleid.com")
                .issueTime(Date.from(Instant.now()))
                .expirationTime(Date.from(expiry))
                .build();
        SignedJWT jwt = new SignedJWT(
                new JWSHeader.Builder(JWSAlgorithm.RS256).keyID(key.getKeyID()).build(),
                claims);
        jwt.sign(new RSASSASigner(key.toRSAPrivateKey()));
        return jwt.serialize();
    }

    @Test
    @DisplayName("test1: 정상 애플 identityToken이면 sub/email 프로필을 반환한다")
    void test1() throws Exception {
        AppleServiceImpl service = newService();
        String token = sign(signingKey, ISSUER, CLIENT_ID, Instant.now().plus(1, ChronoUnit.HOURS));

        SocialProfile profile = service.getProfile(token);

        assertThat(profile.provider()).isEqualTo(LoginRequestSocialType.APPLE);
        assertThat(profile.sub()).isEqualTo("apple-sub-001");
        assertThat(profile.email()).isEqualTo("user@privaterelay.appleid.com");
        assertThat(profile.name()).isNull();
        assertThat(profile.phone()).isNull();
    }

    @Test
    @DisplayName("test2: 정상 토큰이면 verifyAccessToken이 예외 없이 통과한다")
    void test2() throws Exception {
        AppleServiceImpl service = newService();
        String token = sign(signingKey, ISSUER, CLIENT_ID, Instant.now().plus(1, ChronoUnit.HOURS));

        service.verifyAccessToken(token);
    }

    @Test
    @DisplayName("test3: audience(client-id)가 다르면 BadCredentialsException")
    void test3() throws Exception {
        AppleServiceImpl service = newService();
        String token = sign(signingKey, ISSUER, "com.other.app", Instant.now().plus(1, ChronoUnit.HOURS));

        assertThatThrownBy(() -> service.verifyAccessToken(token))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("test4: issuer가 다르면 BadCredentialsException")
    void test4() throws Exception {
        AppleServiceImpl service = newService();
        String token = sign(signingKey, "https://evil.example.com", CLIENT_ID, Instant.now().plus(1, ChronoUnit.HOURS));

        assertThatThrownBy(() -> service.verifyAccessToken(token))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("test5: 만료된 토큰이면 BadCredentialsException")
    void test5() throws Exception {
        AppleServiceImpl service = newService();
        String token = sign(signingKey, ISSUER, CLIENT_ID, Instant.now().minus(1, ChronoUnit.HOURS));

        assertThatThrownBy(() -> service.verifyAccessToken(token))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("test6: JWKS에 없는 키로 서명(위조)하면 BadCredentialsException")
    void test6() throws Exception {
        AppleServiceImpl service = newService();
        String token = sign(rogueKey, ISSUER, CLIENT_ID, Instant.now().plus(1, ChronoUnit.HOURS));

        assertThatThrownBy(() -> service.verifyAccessToken(token))
                .isInstanceOf(BadCredentialsException.class);
    }
}

package com.chamapi.security.service.impl;

import com.chamapi.common.exception.BadRequestException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.crypto.ECDSAVerifier;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.interfaces.ECPublicKey;
import java.security.spec.ECGenParameterSpec;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * 애플 토큰 철회 단위 테스트.
 * 애플 /auth/token, /auth/revoke 를 JDK 내장 HttpServer로 흉내 내고,
 * 테스트용 EC 키(.p8과 같은 PKCS8 PEM)로 client_secret 이 제대로 서명되는지 본다.
 */
class AppleRevokeServiceImplTest {

    private static final String CLIENT_ID = "kr.or.cham.equality";
    private static final String TEAM_ID = "TEAM123456";
    private static final String KEY_ID = "KEY1234567";

    private static HttpServer server;
    private static String baseUri;
    private static KeyPair keyPair;
    private static String privateKeyBase64;

    // 가짜 애플 서버 상태(테스트마다 초기화)
    private static final List<String> calledPaths = new ArrayList<>();
    private static final Map<String, Map<String, String>> receivedForms = new HashMap<>();
    private static volatile int tokenStatus;
    private static volatile String tokenBody;
    private static volatile int revokeStatus;

    @BeforeAll
    static void setUp() throws Exception {
        KeyPairGenerator generator = KeyPairGenerator.getInstance("EC");
        generator.initialize(new ECGenParameterSpec("secp256r1"));
        keyPair = generator.generateKeyPair();
        String pem = "-----BEGIN PRIVATE KEY-----\n"
                + Base64.getMimeEncoder(64, "\n".getBytes(StandardCharsets.UTF_8))
                        .encodeToString(keyPair.getPrivate().getEncoded())
                + "\n-----END PRIVATE KEY-----\n";
        privateKeyBase64 = Base64.getEncoder().encodeToString(pem.getBytes(StandardCharsets.UTF_8));

        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/auth/token", exchange -> {
            recordRequest(exchange.getRequestURI().getPath(),
                    new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] body = tokenBody.getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(tokenStatus, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        server.createContext("/auth/revoke", exchange -> {
            recordRequest(exchange.getRequestURI().getPath(),
                    new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            exchange.sendResponseHeaders(revokeStatus, -1);
            exchange.close();
        });
        server.start();
        baseUri = "http://127.0.0.1:" + server.getAddress().getPort();
    }

    @AfterAll
    static void tearDown() {
        server.stop(0);
    }

    @BeforeEach
    void resetServer() {
        calledPaths.clear();
        receivedForms.clear();
        tokenStatus = 200;
        tokenBody = "{\"access_token\":\"access-1\",\"refresh_token\":\"refresh-1\",\"token_type\":\"Bearer\"}";
        revokeStatus = 200;
    }

    private static synchronized void recordRequest(String path, String formBody) {
        calledPaths.add(path);
        Map<String, String> form = new HashMap<>();
        for (String pair : formBody.split("&")) {
            String[] keyValue = pair.split("=", 2);
            form.put(URLDecoder.decode(keyValue[0], StandardCharsets.UTF_8),
                    keyValue.length > 1 ? URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8) : "");
        }
        receivedForms.put(path, form);
    }

    private AppleRevokeServiceImpl createService(String keyBase64) {
        AppleRevokeServiceImpl service = new AppleRevokeServiceImpl();
        ReflectionTestUtils.setField(service, "clientId", CLIENT_ID);
        ReflectionTestUtils.setField(service, "teamId", TEAM_ID);
        ReflectionTestUtils.setField(service, "keyId", KEY_ID);
        ReflectionTestUtils.setField(service, "privateKeyBase64", keyBase64);
        ReflectionTestUtils.setField(service, "tokenUri", baseUri + "/auth/token");
        ReflectionTestUtils.setField(service, "revokeUri", baseUri + "/auth/revoke");
        return service;
    }

    @Test
    @DisplayName("authorizationCode를 교환해 받은 refresh token을 철회한다")
    void test1() {
        createService(privateKeyBase64).revokeByAuthorizationCode("code-1");

        assertThat(calledPaths).containsExactly("/auth/token", "/auth/revoke");
        assertThat(receivedForms.get("/auth/token"))
                .containsEntry("grant_type", "authorization_code")
                .containsEntry("code", "code-1")
                .containsEntry("client_id", CLIENT_ID);
        assertThat(receivedForms.get("/auth/revoke"))
                .containsEntry("token", "refresh-1")
                .containsEntry("token_type_hint", "refresh_token")
                .containsEntry("client_id", CLIENT_ID);
    }

    @Test
    @DisplayName("client_secret은 .p8 키로 서명한 ES256 JWT이고 애플이 요구하는 클레임을 담는다")
    void test2() throws Exception {
        createService(privateKeyBase64).revokeByAuthorizationCode("code-1");

        SignedJWT clientSecret = SignedJWT.parse(receivedForms.get("/auth/token").get("client_secret"));
        assertThat(clientSecret.verify(new ECDSAVerifier((ECPublicKey) keyPair.getPublic()))).isTrue();
        assertThat(clientSecret.getHeader().getAlgorithm()).isEqualTo(JWSAlgorithm.ES256);
        assertThat(clientSecret.getHeader().getKeyID()).isEqualTo(KEY_ID);
        assertThat(clientSecret.getJWTClaimsSet().getIssuer()).isEqualTo(TEAM_ID);
        assertThat(clientSecret.getJWTClaimsSet().getSubject()).isEqualTo(CLIENT_ID);
        assertThat(clientSecret.getJWTClaimsSet().getAudience()).containsExactly("https://appleid.apple.com");
        assertThat(clientSecret.getJWTClaimsSet().getExpirationTime())
                .isAfter(clientSecret.getJWTClaimsSet().getIssueTime());
    }

    @Test
    @DisplayName("refresh token이 없으면 access token을 철회한다")
    void test3() {
        tokenBody = "{\"access_token\":\"access-1\",\"token_type\":\"Bearer\"}";

        createService(privateKeyBase64).revokeByAuthorizationCode("code-1");

        assertThat(receivedForms.get("/auth/revoke"))
                .containsEntry("token", "access-1")
                .containsEntry("token_type_hint", "access_token");
    }

    @Test
    @DisplayName("코드 교환이 실패하면 철회를 부르지 않고 예외를 던진다")
    void test4() {
        tokenStatus = 400;
        tokenBody = "{\"error\":\"invalid_grant\"}";

        assertThatThrownBy(() -> createService(privateKeyBase64).revokeByAuthorizationCode("used-code"))
                .isInstanceOf(BadRequestException.class);
        assertThat(calledPaths).containsExactly("/auth/token");
    }

    @Test
    @DisplayName("철회 호출이 실패하면 예외를 던진다")
    void test5() {
        revokeStatus = 500;

        assertThatThrownBy(() -> createService(privateKeyBase64).revokeByAuthorizationCode("code-1"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    @DisplayName("코드가 없으면 애플을 부르지 않고 400")
    void test6() {
        assertThatThrownBy(() -> createService(privateKeyBase64).revokeByAuthorizationCode(" "))
                .isInstanceOf(BadRequestException.class);
        assertThat(calledPaths).isEmpty();
    }

    @Test
    @DisplayName("키 설정이 없으면 탈퇴가 진행되지 않도록 예외를 던진다")
    void test7() {
        assertThatThrownBy(() -> createService("").revokeByAuthorizationCode("code-1"))
                .isInstanceOf(IllegalStateException.class);
        assertThat(calledPaths).isEmpty();
    }
}

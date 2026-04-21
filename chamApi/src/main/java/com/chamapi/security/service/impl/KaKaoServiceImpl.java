package com.chamapi.security.service.impl;


import com.chamapi.security.service.SocialService;
import com.chamapi.security.dto.response.AccessTokenResponse;
import com.chamapi.security.dto.response.KaKaoProfileResponse;
import com.chamapi.security.service.social.LoginRequestSocialType;
import com.chamapi.security.service.social.SocialProfile;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;


@Service("kakaoService")
@Transactional
@RequiredArgsConstructor
public class KaKaoServiceImpl implements SocialService {

    @Value("${kakao.clientId:test}")
    private String kakaoClientId;
    @Value("${kakao.redirecturi:test}")
    private String kakaoRedirectUri;
    @Value("${kakao.client-secret:test}")
    private String kakaoClientSecret;
    @Value("${kakao.appId:0}")
    private Long kakaoAppId;

    @Override
    public AccessTokenResponse getAccessToken(String code, String socialType) {

        RestClient restClient = RestClient.create();

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();

        params.add("code", code);
        params.add("client_id", kakaoClientId);
        params.add("redirect_uri", kakaoRedirectUri);
        params.add("grant_type", "authorization_code");
        params.add("client_secret", kakaoClientSecret);

        return restClient.post()
                .uri("https://kauth.kakao.com/oauth/token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(params)
                .retrieve()
                .toEntity(AccessTokenResponse.class)
                .getBody();
    }

    @Override
    public SocialProfile getProfile(String accessToken) {
        KaKaoProfileResponse resp = RestClient.create().get()
                .uri("https://kapi.kakao.com/v2/user/me")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                .retrieve()
                .body(KaKaoProfileResponse.class);   //  body만 받기

        Long id = resp != null ? resp.getId() : null;

        KaKaoProfileResponse.KakaoAccount acc =
                resp != null ? resp.getKakaoAccount() : null;
        KaKaoProfileResponse.Profile p =
                acc != null ? acc.getProfile() : null;

        String email = acc != null ? acc.getEmail() : null;
        String name = acc != null ? acc.getName() : null;
        String phone = acc != null ? acc.getPhoneNumber() : null;

        return new SocialProfile(
                LoginRequestSocialType.KAKAO,
                id != null ? String.valueOf(id) : null,
                email,
                name,
                phone
        );
    }

    /**
     * 앱 SDK에서 받은 access token이 내 카카오 앱에서 발급된 것인지 검증.
     * 다른 카카오 앱 토큰으로 우회 로그인되는 것을 막는다.
     */
    @Override
    public void verifyAccessToken(String accessToken) {
        try {
            AccessTokenInfo info = RestClient.create().get()
                    .uri("https://kapi.kakao.com/v1/user/access_token_info")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + accessToken)
                    .retrieve()
                    .body(AccessTokenInfo.class);

            if (info == null || info.getAppId() == null) {
                throw new BadCredentialsException("카카오 토큰 정보를 확인할 수 없습니다.");
            }
            if (!kakaoAppId.equals(info.getAppId())) {
                throw new BadCredentialsException("이 앱에서 발급된 카카오 토큰이 아닙니다.");
            }
        } catch (RestClientResponseException e) {
            throw new BadCredentialsException("유효하지 않은 카카오 토큰입니다.", e);
        }
    }

    @Data
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class AccessTokenInfo {
        private Long id;

        @JsonProperty("app_id")
        private Long appId;

    }
}

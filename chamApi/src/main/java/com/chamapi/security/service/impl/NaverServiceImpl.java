package com.chamapi.security.service.impl;

import com.chamapi.security.service.SocialService;
import com.chamapi.security.dto.response.AccessTokenResponse;
import com.chamapi.security.dto.response.NaverProfileResponse;
import com.chamapi.security.service.social.LoginRequestSocialType;
import com.chamapi.security.service.social.SocialProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.UUID;

@Service("naverService")
@Transactional
@RequiredArgsConstructor
public class NaverServiceImpl implements SocialService {
    
    @Value("${naver.clientId:test}")
    private String naverClientId;
    @Value("${naver.redirecturi:test}")
    private String naverRedirectUri;
    @Value("${naver.client-secret:test}")
    private String naverClientSecret;
    
    @Override
    public AccessTokenResponse getAccessToken(String code, String socialType) {
        RestClient restClient = RestClient.create();
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        
        params.add("code", code);
        params.add("client_id", naverClientId);
        params.add("redirect_uri", naverRedirectUri);
        params.add("grant_type", "authorization_code");
        params.add("client_secret", naverClientSecret);
        params.add("state", UUID.randomUUID().toString());
        
        ResponseEntity<AccessTokenResponse> response = restClient.post()
                .uri("https://nid.naver.com/oauth2.0/token")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .body(params)
                .retrieve()
                .toEntity(AccessTokenResponse.class);
        
        return response.getBody();
    }
    
    @Override
    public SocialProfile getProfile(String accessToken) {
        RestClient restClient = RestClient.create();
        
        NaverProfileResponse np = restClient.get()
                .uri("https://openapi.naver.com/v1/nid/me")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .body(NaverProfileResponse.class);
        
        
        String id = np != null ? np.getResponse().getId() : null;
        String email = np != null ? np.getResponse().getEmail() : null;
        String name = np != null ? np.getResponse().getName() : null;
        String phone = np != null ? np.getResponse().getMobile() : null;
        
        return new SocialProfile(
                LoginRequestSocialType.NAVER,
                id,
                email,
                name,
                phone
        );
    }

    /**
     * 앱 SDK로 받은 access token이 유효한 네이버 토큰인지 검증.
     * 네이버는 access_token_info 같은 app_id 확인 엔드포인트가 없어서,
     * /v1/nid/me 호출로 유효성만 확인한다.
     * (네이버 access token은 Client ID/Secret 쌍에 묶여 발급되므로,
     *  다른 네이버 앱의 토큰으로는 이 호출이 유효한 응답을 돌려주지 않는다.)
     */
    @Override
    public void verifyAccessToken(String accessToken) {
        try {
            NaverProfileResponse resp = RestClient.create().get()
                    .uri("https://openapi.naver.com/v1/nid/me")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(NaverProfileResponse.class);

            if (resp == null || resp.getResponse() == null || resp.getResponse().getId() == null) {
                throw new BadCredentialsException("유효하지 않은 네이버 토큰입니다.");
            }
        } catch (RestClientResponseException e) {
            throw new BadCredentialsException("유효하지 않은 네이버 토큰입니다.", e);
        }
    }
}

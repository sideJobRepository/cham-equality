package com.chamapi.security.service;


import com.chamapi.security.service.response.AccessTokenResponse;
import com.chamapi.security.service.response.KaKaoProfileResponse;
import com.chamapi.security.service.social.SocialProfile;
import com.chamapi.security.service.social.LoginRequestSocialType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;


@Service("kakaoService")
@Transactional
@RequiredArgsConstructor
public class KaKaoServiceImpl implements SocialService {
    
    @Value("${kakao.clientId}")
    private String kakaoClientId;
    @Value("${kakao.redirecturi}")
    private String kakaoRedirectUri;
    @Value("${kakao.client-secret}")
    private String kakaoClientSecret;
    @Value("${kakao.redirecturi2}")
    private String kakaoRedirectUri2;
    
    @Override
    public AccessTokenResponse getAccessToken(String code, String socialType) {
        
        RestClient restClient = RestClient.create();
        
        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        
        params.add("code",code);
        params.add("client_id",kakaoClientId);
        if("KAKAO".equals(socialType)){
            params.add("redirect_uri",kakaoRedirectUri);
        }else {
            params.add("redirect_uri",kakaoRedirectUri2);
        }
        params.add("grant_type", "authorization_code");
        params.add("client_secret",kakaoClientSecret);
        
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
        
             String email         = acc != null ? acc.getEmail()          : null;
             String name          = acc != null ? acc.getName()           : null;
             String phone         = acc != null ? acc.getPhoneNumber()    : null;
             
             return new SocialProfile(
                     LoginRequestSocialType.KAKAO,
                     id != null ? String.valueOf(id) : null,
                     email,
                     name,
                     phone
             );
    }
}

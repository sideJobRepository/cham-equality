package com.chamapi.security.provider;


import com.chamapi.security.context.MemberContext;
import com.chamapi.security.service.impl.MemberDetailServiceImpl;
import com.chamapi.security.service.SocialService;
import com.chamapi.security.service.social.LoginRequestSocialLoginUrl;
import com.chamapi.security.service.social.SocialProfile;
import com.chamapi.security.token.SocialAuthenticationToken;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Component;

@Component(value = "socialAuthenticationProvider")
@RequiredArgsConstructor
public class SocialAuthenticationProvider implements AuthenticationProvider {

    private final SocialService kakaoService;
    private final SocialService naverService;
    private final MemberDetailServiceImpl bgmAgitMemberDetailService;


    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {

        SocialAuthenticationToken token = (SocialAuthenticationToken) authentication;

        LoginRequestSocialLoginUrl socialType = token.getLoginRequestSocialLoginUrl();
        String credential = (String) token.getPrincipal();

        SocialService socialService = getSocialService(socialType);

        String accessToken;
        if (socialType.isApp()) {
            // 앱 SDK: 이미 access token. 내 앱 토큰인지 검증 후 그대로 사용
            socialService.verifyAccessToken(credential);
            accessToken = credential;
        } else {
            // 웹: 인가코드 → access token 교환
            accessToken = socialService.getAccessToken(credential, socialType.name()).getAccessToken();
        }

        SocialProfile profile = socialService.getProfile(accessToken);

        MemberContext memberContext = (MemberContext) bgmAgitMemberDetailService.loadUserByUsername(profile);

        return new SocialAuthenticationToken(
                memberContext.getMember(),
                null,
                null,
                memberContext.getAuthorities()
        );

    }

    @Override
    public boolean supports(Class<?> authentication) {
        return SocialAuthenticationToken.class.isAssignableFrom(authentication);
    }

    private SocialService getSocialService(LoginRequestSocialLoginUrl socialType) {
        return switch (socialType) {
            case KAKAO, APP_KAKAO -> kakaoService;
            case NAVER, APP_NAVER -> naverService;
        };
    }
}

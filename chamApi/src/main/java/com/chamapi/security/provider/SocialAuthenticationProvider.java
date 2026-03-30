package com.chamapi.security.provider;


import com.chamapi.security.context.MemberContext;
import com.chamapi.security.service.MemberDetailService;
import com.chamapi.security.service.SocialService;
import com.chamapi.security.service.response.AccessTokenResponse;
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
    private final MemberDetailService bgmAgitMemberDetailService;
    
    
    @Override
    public Authentication authenticate(Authentication authentication) throws AuthenticationException {
        
        SocialAuthenticationToken token = (SocialAuthenticationToken) authentication;
        
        String socialType = token.getLoginRequestSocialLoginUrl().name();
        String authorizeCode = (String) token.getPrincipal();
        
        SocialService socialService = getSocialService(socialType);
        AccessTokenResponse accessToken = socialService.getAccessToken(authorizeCode, socialType);
        SocialProfile profile = socialService.getProfile(accessToken.getAccessToken());
        
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
    
    private SocialService getSocialService(String socialType) {
        return switch (socialType) {
            case "KAKAO", "NEXT_KAKAO" -> kakaoService;
            case "NAVER", "NEXT_NAVER" -> naverService;
            default -> throw new BadCredentialsException("존재하지 않는 소셜 로그인 url입니다: " + socialType);
        };
    }
}

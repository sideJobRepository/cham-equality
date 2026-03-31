package com.chamapi.security.filter;


import com.chamapi.security.dto.request.SocialAuthenticationRequest;
import com.chamapi.security.service.social.LoginRequestSocialLoginUrl;
import com.chamapi.security.token.SocialAuthenticationToken;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AbstractAuthenticationProcessingFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import org.springframework.security.web.util.matcher.OrRequestMatcher;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;

public class ChamEqualityAuthenticationFilter extends AbstractAuthenticationProcessingFilter {
    
    
    public ChamEqualityAuthenticationFilter() {
        super(new OrRequestMatcher(
                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, "/api/kakao-login"),
                PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.POST, "/api/naver-login")
        ));
    }
    
    @Override
    public Authentication attemptAuthentication(HttpServletRequest request, HttpServletResponse response) throws AuthenticationException, IOException, ServletException {
        
        String uri = request.getRequestURI();
        
        JsonMapper jsonMapper = new JsonMapper();
        SocialAuthenticationRequest loginRequest = jsonMapper.readValue(request.getReader(), SocialAuthenticationRequest.class);
        
        if (loginRequest.getCode() == null || loginRequest.getCode().isBlank()) {
            throw new AuthenticationServiceException("code 값이 없습니다.");
        }
        SocialAuthenticationToken authRequest = new SocialAuthenticationToken(
                loginRequest.getCode(),
                LoginRequestSocialLoginUrl.getSocialType(uri)
        );
        
        return this.getAuthenticationManager().authenticate(authRequest);
    }
}

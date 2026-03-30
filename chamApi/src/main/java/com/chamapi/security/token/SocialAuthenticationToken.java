package com.chamapi.security.token;


import com.chamapi.security.service.social.LoginRequestSocialLoginUrl;
import lombok.Getter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;

import java.util.Collection;
import java.util.Collections;

@Getter
public class SocialAuthenticationToken extends AbstractAuthenticationToken {
    
    private final Object principal;
    private final LoginRequestSocialLoginUrl loginRequestSocialLoginUrl;
    private final Object credentials;
    
    public SocialAuthenticationToken(String principal, LoginRequestSocialLoginUrl loginRequestSocialLoginUrl) {
        super(Collections.emptyList());
        this.principal = principal;
        this.loginRequestSocialLoginUrl = loginRequestSocialLoginUrl;
        this.credentials = null;
        setAuthenticated(false);
    }
    
    public SocialAuthenticationToken(Object principal, LoginRequestSocialLoginUrl loginRequestSocialLoginUrl, Object credentials, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.principal = principal;
        this.loginRequestSocialLoginUrl = loginRequestSocialLoginUrl;
        this.credentials = credentials;
        setAuthenticated(true);
    }
    
    @Override
    public Object getCredentials() {
        return this.credentials;
    }
    
    @Override
    public Object getPrincipal() {
        return this.principal;
    }
    
    
}


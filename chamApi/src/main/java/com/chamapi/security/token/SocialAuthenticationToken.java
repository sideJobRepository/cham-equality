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
    private final String providedName;

    public SocialAuthenticationToken(String principal, LoginRequestSocialLoginUrl loginRequestSocialLoginUrl, String providedName) {
        super(Collections.emptyList());
        this.principal = principal;
        this.loginRequestSocialLoginUrl = loginRequestSocialLoginUrl;
        this.credentials = null;
        this.providedName = providedName;
        setAuthenticated(false);
    }

    public SocialAuthenticationToken(Object principal, LoginRequestSocialLoginUrl loginRequestSocialLoginUrl, Object credentials, Collection<? extends GrantedAuthority> authorities) {
        super(authorities);
        this.principal = principal;
        this.loginRequestSocialLoginUrl = loginRequestSocialLoginUrl;
        this.credentials = credentials;
        this.providedName = null;
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


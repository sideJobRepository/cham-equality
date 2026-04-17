package com.chamapi.authentication.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@Getter
@Setter
@ConfigurationProperties(prefix = "auth")
public class AuthProperties {

    private Cookie cookie;
    private RefreshToken refreshToken;
    
    public AuthProperties() {
        this.cookie = new Cookie();
        this.refreshToken = new RefreshToken();
    }
    
    @Getter
    @Setter
    public static class Cookie {
        private String name = "refreshToken";
        private boolean secure = false;
        private String path = "/";
        private String sameSite = "Strict";
    }

    @Getter
    @Setter
    public static class RefreshToken {
        private Duration expiry = Duration.ofDays(1);
    }
}

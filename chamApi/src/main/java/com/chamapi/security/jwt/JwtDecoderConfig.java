package com.chamapi.security.jwt;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.jwk.RSAKey;
import org.springframework.boot.security.oauth2.server.resource.autoconfigure.OAuth2ResourceServerProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

@Configuration
public class JwtDecoderConfig {
    
    @Bean
    public JwtDecoder jwtDecoderByPublicKeyValue(RSAKey rsaKey, OAuth2ResourceServerProperties properties) throws JOSEException {
        return NimbusJwtDecoder.withPublicKey(rsaKey.toRSAPublicKey())
                .signatureAlgorithm(SignatureAlgorithm.from(properties.getJwt().getJwsAlgorithms().get(0)))
                .build();
    }
}
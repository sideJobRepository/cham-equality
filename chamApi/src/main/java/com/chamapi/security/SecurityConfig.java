package com.chamapi.security;


import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@EnableWebSecurity
@Configuration
@RequiredArgsConstructor
public class SecurityConfig {
    
    private final String[] resource = {"/css/**", "/images/**", "/js/**", "/favicon.*", "/*/icon-*"};
    
    @Value("${app.cors-url}")
    private String corsUrl;
    
    private final AuthenticationSuccessHandler chamEqualityAuthenticationSuccessHandler;
    private final AuthenticationFailureHandler chamEqualityAuthenticationFailureHandler;
    private final AuthenticationEntryPoint chamEqualityAuthenticationEntryPoint;
    private final AuthorizationManager<RequestAuthorizationContext> chamEqualityAuthorizationManager;
    private final AuthenticationProvider socialAuthenticationProvider;
    private final AccessDeniedHandler ChamEqualityAccessDeniedHandler;
    
    
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) {
        
        AuthenticationManagerBuilder managerBuilder = http.getSharedObject(AuthenticationManagerBuilder.class);
        managerBuilder.authenticationProvider(socialAuthenticationProvider);
        AuthenticationManager authenticationManager = managerBuilder.build();
        http.authorizeHttpRequests(auth -> auth
                        .requestMatchers(resource).permitAll()
                .anyRequest().access(chamEqualityAuthorizationManager))
                .authenticationManager(authenticationManager)
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .oauth2ResourceServer(oauth -> oauth
                        .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
                        .authenticationEntryPoint(chamEqualityAuthenticationEntryPoint)
                        .accessDeniedHandler(ChamEqualityAccessDeniedHandler)
                )
                .exceptionHandling(e ->
                        e.authenticationEntryPoint(chamEqualityAuthenticationEntryPoint).
                    accessDeniedHandler(ChamEqualityAccessDeniedHandler))
                .with(new SecurityDsl<>(), securitySecurityDsl -> securitySecurityDsl
                        .chamEqualitySuccessHandler(chamEqualityAuthenticationSuccessHandler)
                        .chamEqualityFailureHandler(chamEqualityAuthenticationFailureHandler)
                );
        return http.build();
    }
    
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
        authoritiesConverter.setAuthorityPrefix("");
        authoritiesConverter.setAuthoritiesClaimName("roles");
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(authoritiesConverter);
        return converter;
    }
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration corsConfiguration = new CorsConfiguration();
        corsConfiguration.setAllowedOrigins(List.of(corsUrl));
        corsConfiguration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
        corsConfiguration.setAllowedHeaders(List.of("*"));
        corsConfiguration.setExposedHeaders(List.of("Set-Cookie", "Content-Disposition"));
        corsConfiguration.setAllowCredentials(true); // (쿠키 전달용)
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", corsConfiguration);
        return source;
    }
}

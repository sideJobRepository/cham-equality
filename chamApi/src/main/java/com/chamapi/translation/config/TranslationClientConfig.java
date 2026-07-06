package com.chamapi.translation.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
@EnableConfigurationProperties(TranslationProperties.class)
public class TranslationClientConfig {

    @Bean(name = "translationRestClient")
    public RestClient translationRestClient(TranslationProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();

        ClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        if (factory instanceof JdkClientHttpRequestFactory jdkFactory) {
            jdkFactory.setReadTimeout(Duration.ofMillis(properties.getTimeoutMillis()));
        } else if (factory instanceof SimpleClientHttpRequestFactory simple) {
            simple.setReadTimeout(Duration.ofMillis(properties.getTimeoutMillis()));
        }

        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "DeepL-Auth-Key " + properties.getApiKey())
                .requestFactory(factory)
                .build();
    }
}

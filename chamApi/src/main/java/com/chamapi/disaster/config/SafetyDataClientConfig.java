package com.chamapi.disaster.config;

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
public class SafetyDataClientConfig {

    /**
     * safetydata.go.kr 전용 RestClient.
     * 윈도우 schannel 이슈를 피하기 위해 JDK HttpClient(TLS 자체 구현)를 사용.
     */
    @Bean(name = "safetyDataRestClient")
    public RestClient safetyDataRestClient(SafetyDataProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(properties.getTimeoutMillis()))
                .build();

        ClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        if (factory instanceof JdkClientHttpRequestFactory jdkFactory) {
            jdkFactory.setReadTimeout(Duration.ofMillis(properties.getTimeoutMillis()));
        } else if (factory instanceof SimpleClientHttpRequestFactory simple) {
            simple.setReadTimeout(properties.getTimeoutMillis());
        }

        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .requestFactory(factory)
                .build();
    }
}

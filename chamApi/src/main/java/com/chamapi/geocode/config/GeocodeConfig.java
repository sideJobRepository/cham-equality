package com.chamapi.geocode.config;

import com.chamapi.disaster.config.SafetyDataProperties;
import org.springframework.beans.factory.annotation.Value;
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
@EnableConfigurationProperties(GeocodingProperties.class)
public class GeocodeConfig {


    @Bean(name = "geocodingRestClient")
    public RestClient geocodingRestClient(GeocodingProperties properties) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();

        ClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(httpClient);
        if (factory instanceof JdkClientHttpRequestFactory jdkFactory) {
            jdkFactory.setReadTimeout(Duration.ofSeconds(3));
        } else if (factory instanceof SimpleClientHttpRequestFactory simple) {
            simple.setReadTimeout(Duration.ofSeconds(3));
        }

        return RestClient.builder()
                .baseUrl(properties.getBaseUrl())
                .defaultHeader("x-ncp-apigw-api-key-id", properties.getApiKeyId())
                .defaultHeader("x-ncp-apigw-api-key", properties.getApiKey())
                .defaultHeader(HttpHeaders.ACCEPT, "application/json")
                .baseUrl(properties.getBaseUrl())
                .requestFactory(factory)
                .build();
    }

}

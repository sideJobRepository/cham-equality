package com.chamapi.geocode.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;


@Getter
@Setter
@ConfigurationProperties(prefix = "data.geocoding")
public class GeocodingProperties {
    private String apiKeyId;
    private String apiKey;
    private String baseUrl;
    private String geocodingPath;
}

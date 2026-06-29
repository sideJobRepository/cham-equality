package com.chamapi.geocode.client;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.geocode.config.GeocodingProperties;
import com.chamapi.geocode.dto.GeocodingResponse;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

@Component
public class GeocodingClient {

    private final RestClient restClient;
    private final GeocodingProperties properties;

    public GeocodingClient(@Qualifier("geocodingRestClient") RestClient restClient, GeocodingProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    public String getEnglishAddress(String query) {
        GeocodingResponse response = restClient.get()
                .uri(uriBuilder ->
                        uriBuilder.path(properties.getGeocodingPath())
                                .queryParam("query", query)
                                .build()
                )
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(GeocodingResponse.class);

        if (response == null || response.addresses() == null || response.addresses().size() != 1) {
            throw new BadRequestException("주소 변환 결과가 유일하지 않습니다: " + query);
        }

        return response.addresses().get(0).englishAddress();
    }


}

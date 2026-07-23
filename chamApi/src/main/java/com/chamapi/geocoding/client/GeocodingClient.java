package com.chamapi.geocoding.client;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.geocoding.config.GeocodingProperties;
import com.chamapi.geocoding.dto.GeocodingResponse;
import com.chamapi.geocoding.dto.ResolvedAddress;
import com.chamapi.geocoding.dto.ReverseGeocodingResponse;
import com.querydsl.core.util.StringUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.util.Optional;

@Component
@Slf4j
public class GeocodingClient {

    private final RestClient restClient;
    private final GeocodingProperties properties;

    public GeocodingClient(@Qualifier("geocodingRestClient") RestClient restClient, GeocodingProperties properties) {
        this.restClient = restClient;
        this.properties = properties;
    }

    public Optional<String> getEnglishAddress(String query) {
        GeocodingResponse response = restClient.get()
                .uri(uriBuilder ->
                        uriBuilder.path(properties.getGeocodingPath())
                                .queryParam("query", query)
                                .build()
                )
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(GeocodingResponse.class);

        if(response == null || response.addresses() == null || response.addresses().isEmpty())
            return Optional.empty();

        if (response.addresses().size() > 1) {
            log.warn("영문주소 변환 결과가 유일하지 않습니다. query = {}", query);
        }

        return Optional.of(response.addresses().getFirst().englishAddress());
    }

    public Optional<GeocodingResponse.Address> getCoordinate(String query) {
        GeocodingResponse response = restClient.get()
                .uri(uriBuilder ->
                        uriBuilder.path(properties.getGeocodingPath())
                                .queryParam("query", query)
                                .build()
                )
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(GeocodingResponse.class);

        if (response == null || response.addresses() == null || response.addresses().isEmpty())
            return Optional.empty();

        return Optional.of(response.addresses().getFirst());
    }

    public ResolvedAddress getAddress(BigDecimal latitude, BigDecimal longitude){
        String coord =  "%s,%s".formatted(longitude, latitude);

        ReverseGeocodingResponse response = restClient.get()
                .uri(uriBuilder ->
                        uriBuilder.path(properties.getReverseGeocodingPath())
                                .queryParam("coord", coord)
                                .queryParam("output", "json")
                                .queryParam("orders", "roadaddr,addr")
                                .build()
                )
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(ReverseGeocodingResponse.class);

        if (response == null || response.results() == null || response.results().isEmpty()) {
            throw new BadRequestException("좌표 변환 결과가 없습니다: " + coord);
        }

        var address = response.getAddress();
        var oldAddress = response.getOldAddress();

        return new ResolvedAddress(address, oldAddress);
    }
}

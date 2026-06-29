package com.chamapi.geocode.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record GeocodingResponse(
        String status,
        Meta meta,
        List<Address> addresses,
        String errorMessage
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Meta(
            Integer totalCount,
            Integer page,
            Integer count
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Address(
            String roadAddress,
            String jibunAddress,
            String englishAddress,
            List<AddressElement> addressElements,
            String x,
            String y,
            Double distance
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record AddressElement(
            List<String> types,
            String longName,
            String shortName,
            String code
    ) {
    }

    public boolean isSuccess() {
        return "OK".equals(status);
    }
}

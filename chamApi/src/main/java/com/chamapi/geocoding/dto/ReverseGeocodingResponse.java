package com.chamapi.geocoding.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ReverseGeocodingResponse(
        Status status,
        List<Result> results
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Status(
            Integer code,
            String name,
            String message
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Result(
            String name,
            Code code,
            Region region,
            Land land
    ) {
        public String getFullName(){
            String areaName = region == null ? null : region.getFullAreaName();
            String landName = land == null ? null : land.getFullName();
            return joinNonBlank(areaName, landName);
        }

        public String getOldFullName(){
            String areaName = region == null ? null : region.getFullAreaName();
            String landName = land == null ? null : land.getOldFullName();
            return joinNonBlank(areaName, landName);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Code(
            String id,
            String type,
            String mappingId
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Region(
            Area area0,
            Area area1,
            Area area2,
            Area area3,
            Area area4
    ) {
        public String getFullAreaName(){
            return Stream.of(area1, area2)
                    .filter(Objects::nonNull)
                    .map(Area::name)
                    .filter(StringUtils::hasText)
                    .collect(Collectors.joining(" "));
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Area(
            String name,
            Coords coords,
            String alias
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Land(
            String type,
            String name,
            String number1,
            String number2,
            Addition addition0,
            Addition addition1,
            Addition addition2,
            Addition addition3,
            Addition addition4,
            Coords coords
    ) {
        public String getFullName(){
            String additionValue = addition0 == null ? null : addition0.value;
            return joinNonBlank(name, number1, additionValue);
        }

        public String getOldFullName(){
            String numberPart = StringUtils.hasText(number2) ? number1 : "%s-%s".formatted(number1, number2);
            return joinNonBlank(name, numberPart);
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Addition(
            String type,
            String value
    ) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Coords(
            Center center
    ) {

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Center(
                String crs,
                Double x,
                Double y
        ) {
        }
    }

    public boolean isSuccess() {
        return status != null && Integer.valueOf(0).equals(status.code());
    }

    public String getAddress() {
        return findResult("roadaddr")
                .map(Result::getFullName)
                .orElse("");
    }

    public String getOldAddress() {
        return findResult("addr")
                .map(Result::getOldFullName)
                .orElse("");
    }

    private Optional<Result> findResult(String orderName) {
        if (results == null) {
            return Optional.empty();
        }
        return results.stream()
                .filter(result -> orderName.equals(result.name()))
                .findFirst();
    }

    static String joinNonBlank(String... values) {
        return Stream.of(values)
                .filter(value -> value != null && !value.isBlank())
                .collect(Collectors.joining(" "));
    }
}

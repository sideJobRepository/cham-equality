package com.chamapi.disaster.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SafetyDataResponse(
        Header header,
        @JsonProperty("totalCount") Integer totalCount,
        @JsonProperty("pageNo") Integer pageNo,
        @JsonProperty("numOfRows") Integer numOfRows,
        List<SafetyDataItem> body
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Header(
            @JsonProperty("resultCode") String resultCode,
            @JsonProperty("resultMsg") String resultMsg,
            @JsonProperty("errorMsg") String errorMsg
    ) {
        public boolean isSuccess() {
            return "00".equals(resultCode);
        }
    }

    public boolean isSuccess() {
        return header != null && header.isSuccess();
    }
}

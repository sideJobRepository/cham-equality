package com.chamapi.disaster.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SafetyDataItem(
        @JsonProperty("SN") Long sn,
        @JsonProperty("MSG_CN") String content,
        @JsonProperty("RCPTN_RGN_NM") String regionName,
        @JsonProperty("EMRG_STEP_NM") String emergencyStep,
        @JsonProperty("DST_SE_NM") String category,
        @JsonProperty("CRT_DT") String createdAt
) {
}

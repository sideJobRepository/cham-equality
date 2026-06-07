package com.chamapi.shelter.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class RegionLevelsResponse {
    private List<RegionSummaryDto> depth0;
    private List<RegionSummaryDto> depth1;
    private List<RegionSummaryDto> depth2;
}

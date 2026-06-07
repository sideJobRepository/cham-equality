package com.chamapi.shelter.dto.response;

import lombok.Getter;

import java.util.Map;

@Getter
public class ShelterAggregateResponse {
    private Map<Long, ShelterResponse> details;
    private RegionLevelsResponse summaries;
}

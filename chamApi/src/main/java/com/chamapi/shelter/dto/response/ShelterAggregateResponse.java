package com.chamapi.shelter.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class ShelterAggregateResponse {
    private Map<Long, PlaceResponse> details;
    private RegionLevelsResponse summaries;
}

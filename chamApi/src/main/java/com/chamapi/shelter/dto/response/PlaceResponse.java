package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;

import java.math.BigDecimal;
import java.util.List;

import static com.chamapi.common.util.NullSafe.mapOrNull;

public record PlaceResponse(
        Long placeId,
        Long regionId,
        String name,
        String address,
        String oldAddress,
        String description,
        BigDecimal x,
        BigDecimal y,
        List<ShelterResponse> shelters
) {
    public static PlaceResponse fromDomain(Place place, List<Shelter> shelters) {
        Region r = place.getRegion();
        return new PlaceResponse(
                place.getId(),
                mapOrNull(r, Region::getRegionId),
                place.getName(),
                place.getAddress(),
                place.getOldAddress(),
                place.getDescription(),
                place.getLongitude(),
                place.getLatitude(),
                shelters.stream().map(ShelterResponse::fromDomain).toList()
        );
    }
}

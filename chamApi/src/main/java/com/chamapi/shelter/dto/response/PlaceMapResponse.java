package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.enums.AccessibilityMatchStatus;

import java.math.BigDecimal;
import java.util.List;

import static com.chamapi.common.util.NullSafe.mapOrNull;
import static com.chamapi.shelter.enums.AccessibilityMatchStatus.*;

public record PlaceMapResponse(
        Long placeId,
        Long regionId,
        String name,
        String englishName,
        String address,
        String oldAddress,
        String englishAddress,
        String description,
        BigDecimal x,
        BigDecimal y,
        AccessibilityMatchStatus accessibilityMatchStatus,
        List<ShelterMapResponse> shelters
) {
    public static PlaceMapResponse fromDomain(Place place, List<ShelterMapResponse> shelters) {
        Region r = place.getRegion();
        return new PlaceMapResponse(
                place.getId(),
                mapOrNull(r, Region::getRegionId),
                place.getName(),
                place.getEnglishName(),
                place.getAddress(),
                place.getOldAddress(),
                place.getEnglishAddress(),
                place.getDescription(),
                place.getLongitude(),
                place.getLatitude(),
                resolvePlaceAccessibilityMatchStatus(shelters),
                shelters
        );
    }

    private static AccessibilityMatchStatus resolvePlaceAccessibilityMatchStatus(List<ShelterMapResponse> shelters){
        if(existsByAccessibilityMatchStatus(shelters, ACCESSIBLE))
            return ACCESSIBLE;
        if(existsByAccessibilityMatchStatus(shelters, PARTIAL))
            return PARTIAL;
        if(existsByAccessibilityMatchStatus(shelters, INACCESSIBLE))
            return INACCESSIBLE;
        return NONE;
    }

    private static boolean existsByAccessibilityMatchStatus(List<ShelterMapResponse> shelters, AccessibilityMatchStatus matchStatus) {
        return shelters.stream()
                .anyMatch(s -> s.accessibilityMatchStatus() == matchStatus);
    }

}

package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;

public record ShelterListResponse(
        Long id,
        String name,
        String address,
        String latitude,
        String longitude,
        Integer area,
        Integer capacity,
        Integer builtYear,
        Integer safetyGrade,
        String managingAuthorityName,
        String managingAuthorityTelNo,
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        Integer pendingReportCount
) {
    public static ShelterListResponse from(Shelter s, Integer pendingReportCount) {
        ShelterAccessibility a = s.getAccessibility();
        return new ShelterListResponse(
                s.getId(),
                s.getName(),
                s.getAddress(),
                s.getLatitude(),
                s.getLongitude(),
                s.getArea(),
                s.getCapacity(),
                s.getBuiltYear(),
                s.getSafetyGrade(),
                s.getManagingAuthorityName(),
                s.getManagingAuthorityTelNo(),
                s.getSignageLanguage(),
                a != null ? a.getAccessibleToilet() : null,
                a != null ? a.getRamp() : null,
                a != null ? a.getElevator() : null,
                a != null ? a.getBrailleBlock() : null,
                a != null ? a.getEtcFacilities() : null,
                pendingReportCount
        );
    }
}

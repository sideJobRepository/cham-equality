package com.chamapi.shelter.dto.response;

import com.chamapi.place.entity.Place;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.enums.ShelterType;

import java.math.BigDecimal;

import static com.chamapi.common.util.NullSafe.mapOrNull;

public record ShelterListResponse(
        Long id,
        String name,
        ShelterType shelterType,
        String address,
        String oldAddress,
        BigDecimal latitude,
        BigDecimal longitude,
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
        ShelterSurveyStatus surveyStatus,
        Integer pendingReportCount
) {
    public static ShelterListResponse from(Shelter s, Integer pendingReportCount) {
        Place p = s.getPlace();
        ShelterAccessibility a = s.getAccessibility();
        return new ShelterListResponse(
                s.getId(),
                s.getName(),
                s.getShelterType(),
                mapOrNull(p, Place::getAddress),
                mapOrNull(p, Place::getOldAddress),
                s.getLatitude(),
                s.getLongitude(),
                s.getArea(),
                s.getCapacity(),
                s.getBuiltYear(),
                s.getSafetyGrade(),
                s.getManagingAuthorityName(),
                s.getManagingAuthorityTelNo(),
                s.getSignageLanguage(),
                mapOrNull(a, ShelterAccessibility::getAccessibleToilet),
                mapOrNull(a, ShelterAccessibility::getRamp),
                mapOrNull(a, ShelterAccessibility::getElevator),
                mapOrNull(a, ShelterAccessibility::getBrailleBlock),
                mapOrNull(a, ShelterAccessibility::getEtcFacilities),
                s.getSurveyStatus(),
                pendingReportCount
        );
    }
}

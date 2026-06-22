package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.AccessibilityMatchStatus;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.enums.ShelterType;

import java.math.BigDecimal;
import java.util.List;

import static com.chamapi.common.util.NullSafe.mapOrNull;

public record ShelterMapResponse(
        Long shelterId,
        Long placeId,
        String name,
        BigDecimal x,
        BigDecimal y,
        Integer area,
        Integer capacity,
        ShelterType shelterType,
        Integer builtYear,
        Integer safetyGrade,
        String description,
        String managingAuthorityName,
        String managingAuthorityTelNo,
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        ShelterSurveyStatus surveyStatus,
        AccessibilityMatchStatus accessibilityMatchStatus,
        List<ShelterMapImageResponse> images
) {
    public static ShelterMapResponse fromDomain(Shelter shelter, List<AccessibilityFeature> accessibilityFeatures, List<ShelterMapImageResponse> images) {
        Place p = shelter.getPlace();
        ShelterAccessibility a = shelter.getAccessibility();
        return new ShelterMapResponse(
                shelter.getId(),
                mapOrNull(p, Place::getId),
                shelter.getName(),
                shelter.getLongitude(),
                shelter.getLatitude(),
                shelter.getArea(),
                shelter.getCapacity(),
                shelter.getShelterType(),
                shelter.getBuiltYear(),
                shelter.getSafetyGrade(),
                shelter.getDescription(),
                shelter.getManagingAuthorityName(),
                shelter.getManagingAuthorityTelNo(),
                shelter.getSignageLanguage(),
                mapOrNull(a, ShelterAccessibility::getAccessibleToilet),
                mapOrNull(a, ShelterAccessibility::getRamp),
                mapOrNull(a, ShelterAccessibility::getElevator),
                mapOrNull(a, ShelterAccessibility::getBrailleBlock),
                mapOrNull(a, ShelterAccessibility::getEtcFacilities),
                shelter.getSurveyStatus(),
                shelter.evaluateAccessibility(accessibilityFeatures),
                images
        );
    }
}

package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.enums.ShelterType;

import java.math.BigDecimal;

import static com.chamapi.common.util.NullSafe.mapOrNull;

public record ShelterResponse(
        Long shelterId,
        Long placeId,
        String placeName,
        String address,
        String oldAddress,
        String placeDescription,
        BigDecimal x,
        BigDecimal y,
        String name,
        BigDecimal latitude,
        BigDecimal longitude,
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
        ShelterSurveyStatus surveyStatus
) {
    public static ShelterResponse fromDomain(Shelter shelter) {
        Place p = shelter.getPlace();
        ShelterAccessibility a = shelter.getAccessibility();
        return new ShelterResponse(
                shelter.getId(),
                mapOrNull(p, Place::getId),
                mapOrNull(p, Place::getName),
                mapOrNull(p, Place::getAddress),
                mapOrNull(p, Place::getOldAddress),
                mapOrNull(p, Place::getDescription),
                mapOrNull(p, Place::getLatitude),
                mapOrNull(p, Place::getLongitude),
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
                shelter.getSurveyStatus()
        );
    }
}

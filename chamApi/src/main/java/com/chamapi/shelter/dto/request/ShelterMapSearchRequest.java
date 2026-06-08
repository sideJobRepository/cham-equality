package com.chamapi.shelter.dto.request;

import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.ShelterType;

import java.util.List;

public record ShelterMapSearchRequest(
        List<ShelterType> shelterTypes,
        List<AccessibilityFeature> accessibilityFeatures
) {
    public ShelterSearchCondition toCondition() {
        return new ShelterSearchCondition(shelterTypes, accessibilityFeatures);
    }
}
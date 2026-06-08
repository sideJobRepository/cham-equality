package com.chamapi.shelter.dto.query;

import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.ShelterType;

import java.util.List;

public record ShelterSearchCondition(
        List<ShelterType> shelterTypes,
        List<AccessibilityFeature> accessibilityFeatures
) {
}

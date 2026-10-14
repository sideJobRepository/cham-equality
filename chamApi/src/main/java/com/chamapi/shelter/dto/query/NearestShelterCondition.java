package com.chamapi.shelter.dto.query;

import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.ShelterType;

import java.math.BigDecimal;
import java.util.List;

public record NearestShelterCondition(
        List<AccessibilityFeature> accessibilityFeatures,
        List<ShelterType> shelterTypes,
        BigDecimal x,
        BigDecimal y
) {
}

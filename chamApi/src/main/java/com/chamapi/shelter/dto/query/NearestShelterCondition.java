package com.chamapi.shelter.dto.query;

import com.chamapi.shelter.enums.AccessibilityFeature;

import java.math.BigDecimal;
import java.util.List;

public record NearestShelterCondition(
        List<AccessibilityFeature> accessibilityFeatures,
        BigDecimal x,
        BigDecimal y
) {
}

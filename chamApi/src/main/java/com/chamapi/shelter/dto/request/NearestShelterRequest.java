package com.chamapi.shelter.dto.request;

import com.chamapi.shelter.dto.query.NearestShelterCondition;
import com.chamapi.shelter.enums.AccessibilityFeature;

import java.math.BigDecimal;
import java.util.List;

public record NearestShelterRequest(
        List<AccessibilityFeature> accessibilityFeatures,
        BigDecimal x,
        BigDecimal y
) {
    public NearestShelterCondition toCondition() {
        return new NearestShelterCondition(accessibilityFeatures, x, y);
    }
}
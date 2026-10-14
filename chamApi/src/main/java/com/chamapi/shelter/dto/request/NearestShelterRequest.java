package com.chamapi.shelter.dto.request;

import com.chamapi.shelter.dto.query.NearestShelterCondition;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.ShelterType;

import java.math.BigDecimal;
import java.util.List;

// shelterTypes 는 비어 있으면 전체 유형. 옛 앱은 이 필드를 보내지 않으므로 선택값으로 둔다.
public record NearestShelterRequest(
        List<AccessibilityFeature> accessibilityFeatures,
        List<ShelterType> shelterTypes,
        BigDecimal x,
        BigDecimal y
) {
    public NearestShelterCondition toCondition() {
        return new NearestShelterCondition(accessibilityFeatures, shelterTypes, x, y);
    }
}

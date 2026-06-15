package com.chamapi.shelter.entity;

import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.AccessibilityMatchStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import java.util.List;

import static com.chamapi.shelter.enums.AccessibilityFeature.*;
import static org.assertj.core.api.Assertions.assertThat;

class ShelterTest {

    @DisplayName("evaluateAccessibility - features가 null이거나 비어있으면 NONE 반환")
    @ParameterizedTest
    @NullAndEmptySource
    void evaluateAccessibility_nullOrEmpty_returnsNone(List<AccessibilityFeature> features) {
        Shelter shelter = shelterWith(ShelterAccessibility.builder().build());

        assertThat(shelter.evaluateAccessibility(features)).isEqualTo(AccessibilityMatchStatus.NONE);
    }

    @DisplayName("evaluateAccessibility - 요청된 모든 feature를 만족하면 ACCESSIBLE 반환")
    @Test
    void evaluateAccessibility_allSatisfied_returnsAccessible() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder()
                .ramp(true)
                .elevator(true)
                .brailleBlock(true)
                .build());

        AccessibilityMatchStatus result = shelter.evaluateAccessibility(List.of(RAMP, ELEVATOR, BRAILLE_BLOCK));

        assertThat(result).isEqualTo(AccessibilityMatchStatus.ACCESSIBLE);
    }

    @DisplayName("evaluateAccessibility - 요청된 feature 중 일부만 만족하면 PARTIAL 반환")
    @Test
    void evaluateAccessibility_partiallySatisfied_returnsPartial() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder()
                .ramp(true)
                .elevator(false)
                .build());

        AccessibilityMatchStatus result = shelter.evaluateAccessibility(List.of(RAMP, ELEVATOR));

        assertThat(result).isEqualTo(AccessibilityMatchStatus.PARTIAL);
    }

    @DisplayName("evaluateAccessibility - 요청된 feature를 하나도 만족하지 못하면 INACCESSIBLE 반환")
    @Test
    void evaluateAccessibility_noneSatisfied_returnsInaccessible() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder()
                .ramp(false)
                .elevator(false)
                .brailleBlock(false)
                .build());

        AccessibilityMatchStatus result = shelter.evaluateAccessibility(List.of(RAMP, ELEVATOR, BRAILLE_BLOCK));

        assertThat(result).isEqualTo(AccessibilityMatchStatus.INACCESSIBLE);
    }

    private static Shelter shelterWith(ShelterAccessibility accessibility) {
        return Shelter.builder().accessibility(accessibility).build();
    }
}

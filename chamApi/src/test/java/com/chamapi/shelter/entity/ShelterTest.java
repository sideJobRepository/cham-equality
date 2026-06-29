package com.chamapi.shelter.entity;

import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.AccessibilityMatchStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;

import java.math.BigDecimal;
import java.util.List;

import static com.chamapi.shelter.enums.AccessibilityFeature.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

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

    // 위도 1도에 해당하는 구면 대권 거리: R * (π / 180)
    private static final double METERS_PER_DEGREE = 6_371_000 * Math.PI / 180;

    @DisplayName("distanceTo - 같은 좌표면 거리는 0")
    @Test
    void distanceTo_samePoint_returnsZero() {
        Shelter shelter = shelterAt(37.5, 127.0);

        double distance = shelter.distanceTo(BigDecimal.valueOf(37.5), BigDecimal.valueOf(127.0));

        assertThat(distance).isCloseTo(0, within(1e-6));
    }

    @DisplayName("distanceTo - 위도만 1도 차이나면 약 111km(미터 단위)")
    @Test
    void distanceTo_oneDegreeLatitude_returnsAbout111km() {
        Shelter shelter = shelterAt(37.0, 127.0);

        // 첫 인자 y = 위도, 둘째 인자 x = 경도
        double distance = shelter.distanceTo(BigDecimal.valueOf(38.0), BigDecimal.valueOf(127.0));

        assertThat(distance).isCloseTo(METERS_PER_DEGREE, within(1.0));
    }

    @DisplayName("distanceTo - 적도에서 경도만 1도 차이나면 약 111km(x가 경도임을 고정)")
    @Test
    void distanceTo_oneDegreeLongitudeAtEquator_returnsAbout111km() {
        Shelter shelter = shelterAt(0.0, 127.0);

        double distance = shelter.distanceTo(BigDecimal.valueOf(0.0), BigDecimal.valueOf(128.0));

        assertThat(distance).isCloseTo(METERS_PER_DEGREE, within(1.0));
    }

    private static Shelter shelterWith(ShelterAccessibility accessibility) {
        return Shelter.builder().accessibility(accessibility).build();
    }

    private static Shelter shelterAt(double latitude, double longitude) {
        return Shelter.builder()
                .latitude(BigDecimal.valueOf(latitude))
                .longitude(BigDecimal.valueOf(longitude))
                .build();
    }
}

package com.chamapi.shelter.enums;

import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static com.chamapi.shelter.enums.AccessibilityFeature.*;
import static org.assertj.core.api.Assertions.assertThat;

class AccessibilityFeatureTest {

    @DisplayName("RAMP - 경사로가 있는 대피소는 true")
    @Test
    void RAMP_isSatisfiedBy_returnsTrue() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder().ramp(true).build());

        assertThat(RAMP.isSatisfiedBy(shelter)).isTrue();
    }

    @DisplayName("RAMP - 경사로가 없는 대피소는 false")
    @Test
    void RAMP_isSatisfiedBy_returnsFalse() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder().ramp(false).build());

        assertThat(RAMP.isSatisfiedBy(shelter)).isFalse();
    }

    @DisplayName("ELEVATOR - 엘리베이터가 있는 대피소는 true")
    @Test
    void ELEVATOR_isSatisfiedBy_returnsTrue() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder().elevator(true).build());

        assertThat(ELEVATOR.isSatisfiedBy(shelter)).isTrue();
    }

    @DisplayName("ELEVATOR - 엘리베이터가 없는 대피소는 false")
    @Test
    void ELEVATOR_isSatisfiedBy_returnsFalse() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder().elevator(false).build());

        assertThat(ELEVATOR.isSatisfiedBy(shelter)).isFalse();
    }

    @DisplayName("BRAILLE_BLOCK - 점자블록이 있는 대피소는 true")
    @Test
    void BRAILLE_BLOCK_isSatisfiedBy_returnsTrue() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder().brailleBlock(true).build());

        assertThat(BRAILLE_BLOCK.isSatisfiedBy(shelter)).isTrue();
    }

    @DisplayName("BRAILLE_BLOCK - 점자블록이 없는 대피소는 false")
    @Test
    void BRAILLE_BLOCK_isSatisfiedBy_returnsFalse() {
        Shelter shelter = shelterWith(ShelterAccessibility.builder().brailleBlock(false).build());

        assertThat(BRAILLE_BLOCK.isSatisfiedBy(shelter)).isFalse();
    }

    private static Shelter shelterWith(ShelterAccessibility accessibility) {
        return Shelter.builder().accessibility(accessibility).build();
    }
}

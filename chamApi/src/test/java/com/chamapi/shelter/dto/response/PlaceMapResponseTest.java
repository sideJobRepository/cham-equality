package com.chamapi.shelter.dto.response;

import static com.chamapi.shelter.enums.AccessibilityMatchStatus.*;
import static org.assertj.core.api.Assertions.assertThat;

import com.chamapi.multilingual.entity.Language;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.enums.AccessibilityMatchStatus;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PlaceMapResponseTest {

    @Test
    @DisplayName("ACCESSIBLE이 하나라도 있으면 PARTIAL·INACCESSIBLE이 섞여 있어도 ACCESSIBLE로 결정된다")
    void resolvesAccessibleWhenAnyShelterAccessible() {
        Place place = place();
        List<ShelterMapResponse> shelters = List.of(
                shelterWithMatchStatus(INACCESSIBLE),
                shelterWithMatchStatus(ACCESSIBLE),
                shelterWithMatchStatus(PARTIAL)
        );

        PlaceMapResponse response = PlaceMapResponse.fromDomain(place, shelters, Language.KO);

        assertThat(response.accessibilityMatchStatus()).isEqualTo(ACCESSIBLE);
    }

    @Test
    @DisplayName("ACCESSIBLE이 없고 PARTIAL이 있으면 INACCESSIBLE·NONE이 섞여 있어도 PARTIAL로 결정된다")
    void resolvesPartialWhenNoAccessibleButPartialExists() {
        Place place = place();
        List<ShelterMapResponse> shelters = List.of(
                shelterWithMatchStatus(NONE),
                shelterWithMatchStatus(INACCESSIBLE),
                shelterWithMatchStatus(PARTIAL)
        );

        PlaceMapResponse response = PlaceMapResponse.fromDomain(place, shelters, Language.KO);

        assertThat(response.accessibilityMatchStatus()).isEqualTo(PARTIAL);
    }

    @Test
    @DisplayName("ACCESSIBLE·PARTIAL이 없고 INACCESSIBLE이 있으면 NONE이 섞여 있어도 INACCESSIBLE로 결정된다")
    void resolvesInaccessibleWhenOnlyInaccessibleAndNoneExist() {
        Place place = place();
        List<ShelterMapResponse> shelters = List.of(
                shelterWithMatchStatus(NONE),
                shelterWithMatchStatus(INACCESSIBLE)
        );

        PlaceMapResponse response = PlaceMapResponse.fromDomain(place, shelters, Language.KO);

        assertThat(response.accessibilityMatchStatus()).isEqualTo(INACCESSIBLE);
    }

    @Test
    @DisplayName("모든 대피소가 NONE이면 NONE으로 결정된다")
    void resolvesNoneWhenAllSheltersNone() {
        Place place = place();
        List<ShelterMapResponse> shelters = List.of(
                shelterWithMatchStatus(NONE),
                shelterWithMatchStatus(NONE)
        );

        PlaceMapResponse response = PlaceMapResponse.fromDomain(place, shelters, Language.KO);

        assertThat(response.accessibilityMatchStatus()).isEqualTo(NONE);
    }

    private Place place() {
        return Place.builder()
                .name("테스트 장소")
                .build();
    }

    private ShelterMapResponse shelterWithMatchStatus(AccessibilityMatchStatus matchStatus) {
        return new ShelterMapResponse(
                null, null, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null, null, null, null,
                matchStatus, null
        );
    }
}

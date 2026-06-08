package com.chamapi.shelter.repository;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.ShelterType;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class ShelterRepositoryTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private ShelterRepository shelterRepository;

    @Autowired
    private EntityManager em;

    @DisplayName("searchByCondition - shelterTypes/accessibilityFeatures 둘 다 null 이면 저장한 모든 Shelter 가 결과에 포함된다")
    @Test
    void searchByCondition_nullConditions_returnsAllSaved() {
        Place place = persistPlace();
        Shelter s1 = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(true, false, false));
        Shelter s2 = persistShelter(place, ShelterType.EARTHQUAKE, accessibility(null, null, null));
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(new ShelterSearchCondition(null, null));

        Set<Long> savedIds = Set.of(s1.getId(), s2.getId());
        assertThat(filterSaved(results, savedIds))
                .containsExactlyInAnyOrder(s1.getId(), s2.getId());
    }

    @DisplayName("searchByCondition - shelterTypes/accessibilityFeatures 둘 다 빈 리스트면 저장한 모든 Shelter 가 결과에 포함된다")
    @Test
    void searchByCondition_emptyConditions_returnsAllSaved() {
        Place place = persistPlace();
        Shelter s1 = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(true, false, false));
        Shelter s2 = persistShelter(place, ShelterType.CHEMICAL_ACCIDENT, null);
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(
                new ShelterSearchCondition(List.of(), List.of()));

        Set<Long> savedIds = Set.of(s1.getId(), s2.getId());
        assertThat(filterSaved(results, savedIds))
                .containsExactlyInAnyOrder(s1.getId(), s2.getId());
    }

    @DisplayName("searchByCondition - shelterTypes 단일 값이면 해당 타입만 반환된다")
    @Test
    void searchByCondition_singleShelterType_returnsOnlyMatchingType() {
        Place place = persistPlace();
        Shelter civil = persistShelter(place, ShelterType.CIVIL_DEFENSE, null);
        Shelter earthquake = persistShelter(place, ShelterType.EARTHQUAKE, null);
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(
                new ShelterSearchCondition(List.of(ShelterType.CIVIL_DEFENSE), null));

        Set<Long> savedIds = Set.of(civil.getId(), earthquake.getId());
        assertThat(filterSaved(results, savedIds)).containsExactly(civil.getId());
    }

    @DisplayName("searchByCondition - shelterTypes 가 여러 값이면 IN 으로 매칭된 타입만 반환된다")
    @Test
    void searchByCondition_multipleShelterTypes_returnsMatchedTypes() {
        Place place = persistPlace();
        Shelter civil = persistShelter(place, ShelterType.CIVIL_DEFENSE, null);
        Shelter earthquake = persistShelter(place, ShelterType.EARTHQUAKE, null);
        Shelter chemical = persistShelter(place, ShelterType.CHEMICAL_ACCIDENT, null);
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(new ShelterSearchCondition(
                List.of(ShelterType.CIVIL_DEFENSE, ShelterType.EARTHQUAKE), null));

        Set<Long> savedIds = Set.of(civil.getId(), earthquake.getId(), chemical.getId());
        assertThat(filterSaved(results, savedIds))
                .containsExactlyInAnyOrder(civil.getId(), earthquake.getId());
    }

    @DisplayName("searchByCondition - accessibilityFeatures=[RAMP] 이면 ramp=true 인 Shelter 만 반환되고 false/null 은 제외된다")
    @Test
    void searchByCondition_rampOnly_returnsShelterWithRampTrue() {
        Place place = persistPlace();
        Shelter rampTrue = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(true, false, false));
        Shelter rampFalse = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(false, true, true));
        Shelter rampNull = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(null, true, true));
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(
                new ShelterSearchCondition(null, List.of(AccessibilityFeature.RAMP)));

        Set<Long> savedIds = Set.of(rampTrue.getId(), rampFalse.getId(), rampNull.getId());
        assertThat(filterSaved(results, savedIds)).containsExactly(rampTrue.getId());
    }

    @DisplayName("searchByCondition - accessibilityFeatures=[ELEVATOR] 이면 elevator=true 인 Shelter 만 반환된다")
    @Test
    void searchByCondition_elevatorOnly_returnsShelterWithElevatorTrue() {
        Place place = persistPlace();
        Shelter elevatorTrue = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(false, true, false));
        Shelter elevatorFalse = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(true, false, true));
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(
                new ShelterSearchCondition(null, List.of(AccessibilityFeature.ELEVATOR)));

        Set<Long> savedIds = Set.of(elevatorTrue.getId(), elevatorFalse.getId());
        assertThat(filterSaved(results, savedIds)).containsExactly(elevatorTrue.getId());
    }

    @DisplayName("searchByCondition - accessibilityFeatures=[BRAILLE_BLOCK] 이면 brailleBlock=true 인 Shelter 만 반환된다")
    @Test
    void searchByCondition_brailleBlockOnly_returnsShelterWithBrailleTrue() {
        Place place = persistPlace();
        Shelter brailleTrue = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(false, false, true));
        Shelter brailleFalse = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(true, true, false));
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(
                new ShelterSearchCondition(null, List.of(AccessibilityFeature.BRAILLE_BLOCK)));

        Set<Long> savedIds = Set.of(brailleTrue.getId(), brailleFalse.getId());
        assertThat(filterSaved(results, savedIds)).containsExactly(brailleTrue.getId());
    }

    @DisplayName("searchByCondition - accessibilityFeatures 가 여러 값이면 OR 결합으로 어느 하나라도 true 인 Shelter 가 반환된다")
    @Test
    void searchByCondition_multipleAccessibilityFeatures_returnsOrCombined() {
        Place place = persistPlace();
        Shelter rampOnly = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(true, false, false));
        Shelter elevatorOnly = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(false, true, false));
        Shelter brailleOnly = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(false, false, true));
        Shelter none = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(false, false, false));
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(new ShelterSearchCondition(
                null,
                List.of(AccessibilityFeature.RAMP, AccessibilityFeature.ELEVATOR)));

        Set<Long> savedIds = Set.of(rampOnly.getId(), elevatorOnly.getId(), brailleOnly.getId(), none.getId());
        assertThat(filterSaved(results, savedIds))
                .containsExactlyInAnyOrder(rampOnly.getId(), elevatorOnly.getId());
    }

    @DisplayName("searchByCondition - shelterTypes 와 accessibilityFeatures 가 동시 지정되면 두 조건이 AND 결합된다")
    @Test
    void searchByCondition_bothConditions_areAndCombined() {
        Place place = persistPlace();
        Shelter civilRamp = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(true, false, false));
        Shelter civilNoRamp = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(false, true, true));
        Shelter earthquakeRamp = persistShelter(place, ShelterType.EARTHQUAKE, accessibility(true, false, false));
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(new ShelterSearchCondition(
                List.of(ShelterType.CIVIL_DEFENSE),
                List.of(AccessibilityFeature.RAMP)));

        Set<Long> savedIds = Set.of(civilRamp.getId(), civilNoRamp.getId(), earthquakeRamp.getId());
        assertThat(filterSaved(results, savedIds)).containsExactly(civilRamp.getId());
    }

    @DisplayName("searchByCondition - 결과 Shelter 의 place 와 region 이 fetch join 으로 즉시 초기화된다")
    @Test
    void searchByCondition_placeAndRegion_areFetchJoined() {
        Place place = persistPlace();
        Shelter saved = persistShelter(place, ShelterType.CIVIL_DEFENSE, accessibility(true, false, false));
        flushAndClear();

        List<Shelter> results = shelterRepository.searchByCondition(
                new ShelterSearchCondition(List.of(ShelterType.CIVIL_DEFENSE), null));

        Shelter found = results.stream()
                .filter(s -> s.getId().equals(saved.getId()))
                .findFirst()
                .orElseThrow();
        assertThat(Hibernate.isInitialized(found.getPlace())).isTrue();
        assertThat(Hibernate.isInitialized(found.getPlace().getRegion())).isTrue();
    }

    private List<Long> filterSaved(List<Shelter> results, Set<Long> savedIds) {
        return results.stream()
                .map(Shelter::getId)
                .filter(savedIds::contains)
                .toList();
    }

    private Place persistPlace() {
        Region region = new Region(null, "서울특별시", "광역시", 1, null, null);
        em.persist(region);
        Place place = Place.builder()
                .region(region)
                .name("테스트장소")
                .address("서울특별시 중구")
                .build();
        em.persist(place);
        return place;
    }

    private Shelter persistShelter(Place place, ShelterType shelterType, ShelterAccessibility accessibility) {
        Shelter shelter = Shelter.builder()
                .place(place)
                .name("테스트대피소")
                .shelterType(shelterType)
                .accessibility(accessibility)
                .build();
        return shelterRepository.save(shelter);
    }

    private ShelterAccessibility accessibility(Boolean ramp, Boolean elevator, Boolean brailleBlock) {
        return ShelterAccessibility.builder()
                .ramp(ramp)
                .elevator(elevator)
                .brailleBlock(brailleBlock)
                .build();
    }

    private void flushAndClear() {
        em.flush();
        em.clear();
    }
}

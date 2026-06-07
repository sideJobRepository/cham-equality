package com.chamapi.shelter.repository;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class ShelterRepositoryTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private ShelterRepository shelterRepository;

    @Autowired
    private EntityManager em;

    @DisplayName("findAllWithPlaceAndRegion — place와 place.region이 fetch join으로 함께 초기화된다")
    @Test
    void findAllWithPlaceAndRegion_fetchJoinsPlaceAndRegion() {
        Region region = new Region(
                null,
                "대전광역시",
                "시도",
                1,
                new BigDecimal("127.38450000"),
                new BigDecimal("36.35040000")
        );
        em.persist(region);

        Place place = Place.builder()
                .region(region)
                .name("테스트장소")
                .address("대전광역시 서구 둔산동 1번지")
                .build();
        em.persist(place);

        Shelter shelter = Shelter.builder()
                .place(place)
                .name("테스트대피소")
                .build();
        em.persist(shelter);

        em.flush();
        em.clear();

        List<Shelter> result = shelterRepository.findAllWithPlaceAndRegion();

        Shelter loaded = result.stream()
                .filter(s -> s.getId().equals(shelter.getId()))
                .findFirst()
                .orElseThrow();

        assertThat(Hibernate.isInitialized(loaded.getPlace())).isTrue();
        assertThat(Hibernate.isInitialized(loaded.getPlace().getRegion())).isTrue();
        assertThat(loaded.getPlace().getName()).isEqualTo("테스트장소");
        assertThat(loaded.getPlace().getRegion().getRegionName()).isEqualTo("대전광역시");
    }
}

package com.chamapi.shelter.service;

import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.dto.response.PlaceResponse;
import com.chamapi.shelter.dto.response.RegionSummaryDto;
import com.chamapi.shelter.dto.response.ShelterAggregateResponse;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.repository.ShelterRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShelterMapServiceTest {

    @Mock
    private ShelterRepository shelterRepository;

    @InjectMocks
    private ShelterMapService shelterMapService;

    @DisplayName("aggregate — 여러 shelter가 place 단위로 묶이고 depth0/1/2 region 집계와 필드 매핑이 정확하다")
    @Test
    void aggregate_groupsAndMapsCorrectly() {
        // 대전 > (서구 > 둔산동, 갈마동), (동구 > 신하동)
        Region daejeon = region(1L, null, 0, "대전",
                new BigDecimal("127.38450000"), new BigDecimal("36.35040000"));
        Region seogu = region(2L, daejeon, 1, "대전 서구",
                new BigDecimal("127.38000000"), new BigDecimal("36.35000000"));
        Region donggu = region(3L, daejeon, 1, "대전 동구",
                new BigDecimal("127.45000000"), new BigDecimal("36.31000000"));
        Region dunsan = region(4L, seogu, 2, "대전 서구 둔산동",
                new BigDecimal("127.38500000"), new BigDecimal("36.35000000"));
        Region galma = region(5L, seogu, 2, "대전 서구 갈마동",
                new BigDecimal("127.36000000"), new BigDecimal("36.34000000"));
        Region sinha = region(6L, donggu, 2, "대전 동구 신하동",
                new BigDecimal("127.46000000"), new BigDecimal("36.32000000"));

        Place p1 = place(11L, dunsan,
                new BigDecimal("127.10000000"), new BigDecimal("36.10000000"));
        Place p2 = place(12L, dunsan, null, null);
        Place p3 = place(13L, galma, null, null);
        Place p4 = place(14L, sinha, null, null);

        Shelter s1 = shelter(21L, p1);
        Shelter s2 = shelter(22L, p1);   // s1과 같은 place 공유 → details merge
        Shelter s3 = shelter(23L, p2);   // 같은 동(둔산), 다른 place
        Shelter s4 = shelter(24L, p3);
        Shelter s5 = shelter(25L, p4);
        Shelter s6 = shelter(26L, p4);

        when(shelterRepository.searchByCondition(any()))
                .thenReturn(List.of(s1, s2, s3, s4, s5, s6));

        ShelterAggregateResponse response = shelterMapService.aggregate(emptyCondition());

        // details — place 4개로 묶이고, 같은 place 공유한 shelter들은 한 엔트리 안에
        Map<Long, PlaceResponse> details = response.getDetails();
        assertThat(details.keySet()).containsExactlyInAnyOrder(11L, 12L, 13L, 14L);
        assertThat(details.get(11L).shelters()).hasSize(2);
        assertThat(details.get(12L).shelters()).hasSize(1);
        assertThat(details.get(13L).shelters()).hasSize(1);
        assertThat(details.get(14L).shelters()).hasSize(2);

        // PlaceResponse 필드 매핑(p1 기준)
        PlaceResponse pr1 = details.get(11L);
        assertThat(pr1.placeId()).isEqualTo(11L);
        assertThat(pr1.regionId()).isEqualTo(4L);
        assertThat(pr1.name()).isEqualTo("place11");
        assertThat(pr1.address()).isEqualTo("address11");
        assertThat(pr1.oldAddress()).isEqualTo("oldAddress11");
        assertThat(pr1.description()).isEqualTo("desc11");
        assertThat(pr1.x()).isEqualByComparingTo("127.10000000"); // x = longitude
        assertThat(pr1.y()).isEqualByComparingTo("36.10000000");  // y = latitude

        // depth0 — 대전 1개, 6 shelter 전체 집계
        List<RegionSummaryDto> depth0 = response.getSummaries().getDepth0();
        assertThat(depth0).hasSize(1);
        RegionSummaryDto d0 = depth0.get(0);
        assertThat(d0.getRegionId()).isEqualTo(1L);
        assertThat(d0.getParentId()).isNull();
        assertThat(d0.getDepth()).isZero();
        assertThat(d0.getPath()).isEqualTo("대전");
        assertThat(d0.getX()).isEqualByComparingTo("127.38450000");
        assertThat(d0.getY()).isEqualByComparingTo("36.35040000");
        assertThat(d0.getCount()).isEqualTo(6);

        // depth1 — 서구(s1,s2,s3,s4=4), 동구(s5,s6=2)
        List<RegionSummaryDto> depth1 = response.getSummaries().getDepth1();
        assertThat(depth1).hasSize(2);
        assertThat(byRegionId(depth1, 2L).getCount()).isEqualTo(4);
        assertThat(byRegionId(depth1, 2L).getParentId()).isEqualTo(1L);
        assertThat(byRegionId(depth1, 2L).getDepth()).isEqualTo(1);
        assertThat(byRegionId(depth1, 3L).getCount()).isEqualTo(2);
        assertThat(byRegionId(depth1, 3L).getParentId()).isEqualTo(1L);

        // depth2 — 둔산(s1,s2,s3=3), 갈마(s4=1), 신하(s5,s6=2)
        List<RegionSummaryDto> depth2 = response.getSummaries().getDepth2();
        assertThat(depth2).hasSize(3);
        assertThat(byRegionId(depth2, 4L).getCount()).isEqualTo(3);
        assertThat(byRegionId(depth2, 4L).getParentId()).isEqualTo(2L);
        assertThat(byRegionId(depth2, 4L).getPath()).isEqualTo("대전 서구 둔산동");
        assertThat(byRegionId(depth2, 5L).getCount()).isEqualTo(1);
        assertThat(byRegionId(depth2, 6L).getCount()).isEqualTo(2);
    }

    @DisplayName("aggregate — shelter.place == null 이면 details/summaries 모두에서 제외된다")
    @Test
    void aggregate_excludesShelterWithoutPlace() {
        Shelter orphan = shelter(1L, null);

        when(shelterRepository.searchByCondition(any()))
                .thenReturn(List.of(orphan));

        ShelterAggregateResponse response = shelterMapService.aggregate(emptyCondition());

        assertThat(response.getDetails()).isEmpty();
        assertThat(response.getSummaries().getDepth0()).isEmpty();
        assertThat(response.getSummaries().getDepth1()).isEmpty();
        assertThat(response.getSummaries().getDepth2()).isEmpty();
    }

    @DisplayName("aggregate — place.region == null 이면 details에는 포함(regionId=null)되지만 summaries에서는 제외된다")
    @Test
    void aggregate_includesPlaceButSkipsSummaryWhenRegionIsNull() {
        Place placeWithoutRegion = place(11L, null,
                new BigDecimal("127.10000000"), new BigDecimal("36.10000000"));
        Shelter s = shelter(21L, placeWithoutRegion);

        when(shelterRepository.searchByCondition(any()))
                .thenReturn(List.of(s));

        ShelterAggregateResponse response = shelterMapService.aggregate(emptyCondition());

        assertThat(response.getDetails()).containsOnlyKeys(11L);
        assertThat(response.getDetails().get(11L).regionId()).isNull();

        assertThat(response.getSummaries().getDepth0()).isEmpty();
        assertThat(response.getSummaries().getDepth1()).isEmpty();
        assertThat(response.getSummaries().getDepth2()).isEmpty();
    }

    private Region region(Long id, Region parent, int depth, String fullName,
                          BigDecimal longitude, BigDecimal latitude) {
        Region region = new Region(parent, "name" + id, "type", depth, longitude, latitude);
        ReflectionTestUtils.setField(region, "regionId", id);
        ReflectionTestUtils.setField(region, "regionFullName", fullName);
        return region;
    }

    private Place place(Long id, Region region, BigDecimal longitude, BigDecimal latitude) {
        Place place = Place.builder()
                .region(region)
                .name("place" + id)
                .address("address" + id)
                .oldAddress("oldAddress" + id)
                .description("desc" + id)
                .longitude(longitude)
                .latitude(latitude)
                .build();
        ReflectionTestUtils.setField(place, "id", id);
        return place;
    }

    private Shelter shelter(Long id, Place place) {
        Shelter shelter = Shelter.builder()
                .place(place)
                .name("shelter" + id)
                .build();
        ReflectionTestUtils.setField(shelter, "id", id);
        return shelter;
    }

    private ShelterSearchCondition emptyCondition() {
        return new ShelterSearchCondition(List.of(), List.of());
    }

    private RegionSummaryDto byRegionId(List<RegionSummaryDto> list, Long regionId) {
        return list.stream()
                .filter(r -> regionId.equals(r.getRegionId()))
                .findFirst()
                .orElseThrow();
    }
}

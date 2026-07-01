package com.chamapi.shelter.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.file.dto.response.FileViewResponse;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.service.S3FileService;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.shelter.dto.query.NearestShelterCondition;
import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.dto.response.PlaceMapResponse;
import com.chamapi.shelter.dto.response.RegionSummaryDto;
import com.chamapi.shelter.dto.response.ShelterAggregateResponse;
import com.chamapi.shelter.dto.response.ShelterMapImageResponse;
import com.chamapi.shelter.dto.response.ShelterMapResponse;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.entity.ShelterImage;
import com.chamapi.shelter.enums.AccessibilityFeature;
import com.chamapi.shelter.enums.AccessibilityMatchStatus;
import com.chamapi.shelter.enums.ShelterImageCategory;
import com.chamapi.shelter.repository.ShelterRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.assertj.core.api.Assertions.tuple;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ShelterMapServiceTest {

    @Mock
    private ShelterRepository shelterRepository;

    @Mock
    private S3FileService fileService;

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
        when(shelterRepository.findImagesGroupedByShelterId(any()))
                .thenReturn(Map.of());

        ShelterAggregateResponse response = shelterMapService.aggregate(emptyCondition(), List.of(), Language.KO);

        // details — place 4개로 묶이고, 같은 place 공유한 shelter들은 한 엔트리 안에
        Map<Long, PlaceMapResponse> details = response.getDetails();
        assertThat(details.keySet()).containsExactlyInAnyOrder(11L, 12L, 13L, 14L);
        assertThat(details.get(11L).shelters()).hasSize(2);
        assertThat(details.get(12L).shelters()).hasSize(1);
        assertThat(details.get(13L).shelters()).hasSize(1);
        assertThat(details.get(14L).shelters()).hasSize(2);

        // PlaceResponse 필드 매핑(p1 기준)
        PlaceMapResponse pr1 = details.get(11L);
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
        when(shelterRepository.findImagesGroupedByShelterId(any()))
                .thenReturn(Map.of());

        ShelterAggregateResponse response = shelterMapService.aggregate(emptyCondition(), List.of(), Language.KO);

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
        when(shelterRepository.findImagesGroupedByShelterId(any()))
                .thenReturn(Map.of());

        ShelterAggregateResponse response = shelterMapService.aggregate(emptyCondition(), List.of(), Language.KO);

        assertThat(response.getDetails()).containsOnlyKeys(11L);
        assertThat(response.getDetails().get(11L).regionId()).isNull();

        assertThat(response.getSummaries().getDepth0()).isEmpty();
        assertThat(response.getSummaries().getDepth1()).isEmpty();
        assertThat(response.getSummaries().getDepth2()).isEmpty();
    }

    @DisplayName("aggregate — 각 shelter의 이미지가 (category, presigned url)로 변환되어 ShelterMapResponse.images에 채워지고, 이미지 없는 shelter는 빈 리스트가 된다")
    @Test
    void aggregate_attachesImagesPerShelter() {
        Region daejeon = region(1L, null, 0, "대전",
                new BigDecimal("127.38450000"), new BigDecimal("36.35040000"));
        Region seogu = region(2L, daejeon, 1, "대전 서구",
                new BigDecimal("127.38000000"), new BigDecimal("36.35000000"));
        Region dunsan = region(3L, seogu, 2, "대전 서구 둔산동",
                new BigDecimal("127.38500000"), new BigDecimal("36.35000000"));
        Place place = place(11L, dunsan,
                new BigDecimal("127.10000000"), new BigDecimal("36.10000000"));

        Shelter s1 = shelter(21L, place);
        Shelter s2 = shelter(22L, place); // 이미지 없는 shelter

        ShelterImage img1 = shelterImage(101L, 21L, 1001L, ShelterImageCategory.EXTERIOR);
        ShelterImage img2 = shelterImage(102L, 21L, 1002L, ShelterImageCategory.RAMP);

        when(shelterRepository.searchByCondition(any()))
                .thenReturn(List.of(s1, s2));
        when(shelterRepository.findImagesGroupedByShelterId(any()))
                .thenReturn(Map.of(21L, List.of(img1, img2)));
        when(fileService.getFileForView(1001L))
                .thenReturn(fileView(1001L, "https://s3.example/exterior.jpg"));
        when(fileService.getFileForView(1002L))
                .thenReturn(fileView(1002L, "https://s3.example/ramp.jpg"));

        ShelterAggregateResponse response = shelterMapService.aggregate(emptyCondition(), List.of(), Language.KO);

        List<ShelterMapResponse> shelters = response.getDetails().get(11L).shelters();
        ShelterMapResponse r1 = shelters.stream().filter(r -> r.shelterId().equals(21L)).findFirst().orElseThrow();
        ShelterMapResponse r2 = shelters.stream().filter(r -> r.shelterId().equals(22L)).findFirst().orElseThrow();

        assertThat(r1.images())
                .extracting(ShelterMapImageResponse::category, ShelterMapImageResponse::url)
                .containsExactly(
                        tuple(ShelterImageCategory.EXTERIOR, "https://s3.example/exterior.jpg"),
                        tuple(ShelterImageCategory.RAMP, "https://s3.example/ramp.jpg")
                );
        assertThat(r2.images()).isEmpty();
    }

    @DisplayName("getNearest — features 없음: 좌표가 있는 후보 중 거리상 가장 가까운 대피소를 반환한다")
    @Test
    void getNearest_returnsClosestWhenNoFeatures() {
        // 기준점 (경도 127.0, 위도 36.0)
        Shelter near = shelterAt(31L, new BigDecimal("127.00100000"), new BigDecimal("36.00100000"));
        Shelter far1 = shelterAt(32L, new BigDecimal("128.00000000"), new BigDecimal("36.00000000"));
        Shelter far2 = shelterAt(33L, new BigDecimal("127.00000000"), new BigDecimal("37.00000000"));

        when(shelterRepository.findAllWithPlaceAndRegion())
                .thenReturn(List.of(far1, near, far2));

        ShelterMapResponse response = shelterMapService.getNearest(
                nearestCondition(new BigDecimal("127.00000000"), new BigDecimal("36.00000000")), Language.KO);

        assertThat(response.shelterId()).isEqualTo(31L);
        assertThat(response.x()).isEqualByComparingTo("127.00100000");
        assertThat(response.y()).isEqualByComparingTo("36.00100000");
    }

    @DisplayName("getNearest — 위도·경도가 null인 대피소는 후보에서 제외되고, 좌표가 있는 대피소가 선택된다")
    @Test
    void getNearest_excludesShelterWithoutCoordinates() {
        Shelter noCoords = shelterAt(41L, null, null);
        Shelter valid = shelterAt(42L, new BigDecimal("127.00000000"), new BigDecimal("36.00000000"));

        when(shelterRepository.findAllWithPlaceAndRegion())
                .thenReturn(List.of(noCoords, valid));

        ShelterMapResponse response = shelterMapService.getNearest(
                nearestCondition(new BigDecimal("127.00000000"), new BigDecimal("36.00000000")), Language.KO);

        assertThat(response.shelterId()).isEqualTo(42L);
    }

    @DisplayName("getNearest — 조건에 맞는 후보가 없으면 BadRequestException")
    @Test
    void getNearest_throwsWhenNoCandidate() {
        Shelter noCoords = shelterAt(51L, null, null);

        when(shelterRepository.findAllWithPlaceAndRegion())
                .thenReturn(List.of(noCoords));

        assertThatThrownBy(() -> shelterMapService.getNearest(
                nearestCondition(new BigDecimal("127.00000000"), new BigDecimal("36.00000000")), Language.KO))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("조건에 맞는 대피소를 찾을 수 없습니다");
    }

    @DisplayName("getNearest — features 지정 시 ACCESSIBLE 대피소만 후보가 된다: 더 가깝지만 일부만 충족(PARTIAL)인 대피소 대신 더 먼 ACCESSIBLE 대피소를 선택한다")
    @Test
    void getNearest_picksAccessibleOverCloserPartial() {
        // 가깝지만 elevator 미충족 → PARTIAL (제외)
        Shelter closerPartial = shelterAt(61L,
                new BigDecimal("127.00000000"), new BigDecimal("36.00000000"),
                accessibility(true, false));
        // 더 멀지만 전부 충족 → ACCESSIBLE (선택)
        Shelter fartherAccessible = shelterAt(62L,
                new BigDecimal("127.50000000"), new BigDecimal("36.00000000"),
                accessibility(true, true));

        when(shelterRepository.findAllWithPlaceAndRegion())
                .thenReturn(List.of(closerPartial, fartherAccessible));

        ShelterMapResponse response = shelterMapService.getNearest(
                nearestCondition(new BigDecimal("127.00000000"), new BigDecimal("36.00000000"),
                        AccessibilityFeature.RAMP, AccessibilityFeature.ELEVATOR), Language.KO);

        assertThat(response.shelterId()).isEqualTo(62L);
        assertThat(response.accessibilityMatchStatus()).isEqualTo(AccessibilityMatchStatus.ACCESSIBLE);
    }

    @DisplayName("getNearest — features 지정 시 ACCESSIBLE 대피소가 하나도 없으면(PARTIAL/INACCESSIBLE만 존재) BadRequestException")
    @Test
    void getNearest_throwsWhenNoAccessibleShelter() {
        Shelter partial = shelterAt(71L,
                new BigDecimal("127.00000000"), new BigDecimal("36.00000000"),
                accessibility(true, false));   // PARTIAL
        Shelter inaccessible = shelterAt(72L,
                new BigDecimal("127.10000000"), new BigDecimal("36.00000000"),
                accessibility(false, false));  // INACCESSIBLE

        when(shelterRepository.findAllWithPlaceAndRegion())
                .thenReturn(List.of(partial, inaccessible));

        assertThatThrownBy(() -> shelterMapService.getNearest(
                nearestCondition(new BigDecimal("127.00000000"), new BigDecimal("36.00000000"),
                        AccessibilityFeature.RAMP, AccessibilityFeature.ELEVATOR), Language.KO))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("조건에 맞는 대피소를 찾을 수 없습니다");
    }

    @DisplayName("getNearest — 선택된 nearest의 이미지가 (category, presigned url)로 매핑되고 accessibilityMatchStatus가 features 기준으로 채워진다")
    @Test
    void getNearest_attachesImagesAndMatchStatus() {
        Shelter nearest = shelterAt(81L,
                new BigDecimal("127.00000000"), new BigDecimal("36.00000000"),
                accessibility(true, null));

        ShelterImage img1 = shelterImage(201L, 81L, 2001L, ShelterImageCategory.EXTERIOR);
        ShelterImage img2 = shelterImage(202L, 81L, 2002L, ShelterImageCategory.RAMP);

        when(shelterRepository.findAllWithPlaceAndRegion())
                .thenReturn(List.of(nearest));
        when(shelterRepository.findImagesByShelterId(81L))
                .thenReturn(List.of(img1, img2));
        when(fileService.getFileForView(2001L))
                .thenReturn(fileView(2001L, "https://s3.example/exterior.jpg"));
        when(fileService.getFileForView(2002L))
                .thenReturn(fileView(2002L, "https://s3.example/ramp.jpg"));

        ShelterMapResponse response = shelterMapService.getNearest(
                nearestCondition(new BigDecimal("127.00000000"), new BigDecimal("36.00000000"),
                        AccessibilityFeature.RAMP), Language.KO);

        assertThat(response.shelterId()).isEqualTo(81L);
        assertThat(response.accessibilityMatchStatus()).isEqualTo(AccessibilityMatchStatus.ACCESSIBLE);
        assertThat(response.images())
                .extracting(ShelterMapImageResponse::category, ShelterMapImageResponse::url)
                .containsExactly(
                        tuple(ShelterImageCategory.EXTERIOR, "https://s3.example/exterior.jpg"),
                        tuple(ShelterImageCategory.RAMP, "https://s3.example/ramp.jpg")
                );
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

    private ShelterImage shelterImage(Long id, Long shelterId, Long fileId, ShelterImageCategory category) {
        ShelterImage image = ShelterImage.builder()
                .shelterId(shelterId)
                .fileId(fileId)
                .category(category)
                .build();
        ReflectionTestUtils.setField(image, "id", id);
        return image;
    }

    private Shelter shelterAt(Long id, BigDecimal longitude, BigDecimal latitude) {
        return shelterAt(id, longitude, latitude, null);
    }

    private Shelter shelterAt(Long id, BigDecimal longitude, BigDecimal latitude, ShelterAccessibility accessibility) {
        Shelter shelter = Shelter.builder()
                .name("shelter" + id)
                .longitude(longitude)
                .latitude(latitude)
                .accessibility(accessibility)
                .build();
        ReflectionTestUtils.setField(shelter, "id", id);
        return shelter;
    }

    private ShelterAccessibility accessibility(Boolean ramp, Boolean elevator) {
        return ShelterAccessibility.builder()
                .ramp(ramp)
                .elevator(elevator)
                .build();
    }

    private NearestShelterCondition nearestCondition(BigDecimal x, BigDecimal y, AccessibilityFeature... features) {
        return new NearestShelterCondition(List.of(features), x, y);
    }

    private FileViewResponse fileView(Long fileId, String url) {
        return new FileViewResponse(fileId, "file" + fileId + ".jpg", 0, "image/jpeg",
                FileType.SHELTER_IMAGE, url, LocalDateTime.now());
    }

    private ShelterSearchCondition emptyCondition() {
        return new ShelterSearchCondition(List.of());
    }

    private RegionSummaryDto byRegionId(List<RegionSummaryDto> list, Long regionId) {
        return list.stream()
                .filter(r -> regionId.equals(r.getRegionId()))
                .findFirst()
                .orElseThrow();
    }
}

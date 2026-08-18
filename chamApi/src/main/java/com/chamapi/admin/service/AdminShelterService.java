package com.chamapi.admin.service;

import com.chamapi.admin.dto.request.AdminShelterBulkCreateItem;
import com.chamapi.admin.dto.request.AdminShelterCreateRequest;
import com.chamapi.admin.dto.request.AdminShelterUpdateRequest;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.geocoding.dto.GeocodingResponse;
import com.chamapi.geocoding.service.GeocodingService;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.repository.PlaceRepository;
import com.chamapi.shelter.repository.RegionRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 관리자만 편집할 수 있는 대피소 필드(시설명/건축년도/대피소타입)의 갱신 서비스.
 * 시민 제보 흐름은 이 필드들을 건드리지 않으며, 관리자가 직접 수정해야만 변경된다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminShelterService {

    private final ShelterRepository shelterRepository;
    private final PlaceRepository placeRepository;
    private final RegionRepository regionRepository;
    private final GeocodingService geocodingService;
    private final EntityManager entityManager;

    /**
     * 대피소 추가. 관리자가 입력한 평평한 파라미터를 물리적 장소({@link Place})와
     * 대피소 레코드({@link Shelter})로 분배해 함께 생성한다(1:1로 붙는 새 place를 만든다).
     * name/englishName/description은 두 엔티티에 공통으로 채운다.
     * 위도/경도는 입력받지 않고 주소를 지오코딩(응답 x=경도, y=위도)해 채운다.
     * surveyStatus는 신규 대피소이므로 {@code NOT_INVESTIGATED}로 시작한다.
     *
     * @return 생성된 대피소 ID
     */
    @Transactional
    public Long createShelter(AdminShelterCreateRequest request) {
        if (!StringUtils.hasText(request.name())) {
            throw new BadRequestException("대피소 이름은 필수입니다.");
        }

        String query = StringUtils.hasText(request.address()) ? request.address() : request.oldAddress();
        if (!StringUtils.hasText(query)) {
            throw new BadRequestException("주소는 필수입니다.");
        }
        GeocodingResponse.Address coordinate = geocodingService.getCoordinate(query);
        BigDecimal latitude = new BigDecimal(coordinate.y());
        BigDecimal longitude = new BigDecimal(coordinate.x());

        Region region = request.regionId() == null
                ? null
                : entityManager.getReference(Region.class, request.regionId());

        Place place = placeRepository.save(Place.createForShelter(
                region,
                request.name(),
                request.englishName(),
                request.address(),
                request.oldAddress(),
                request.englishAddress(),
                request.description(),
                latitude,
                longitude
        ));

        Shelter shelter = Shelter.builder()
                .place(place)
                .name(request.name())
                .englishName(request.englishName())
                .latitude(latitude)
                .longitude(longitude)
                .area(request.area())
                .capacity(request.capacity())
                .shelterType(request.shelterType())
                .builtYear(request.builtYear())
                .safetyGrade(request.safetyGrade())
                .description(request.description())
                .managingAuthorityName(request.managingAuthorityName())
                .managingAuthorityTelNo(request.managingAuthorityTelNo())
                .surveyStatus(ShelterSurveyStatus.NOT_INVESTIGATED)
                .build();

        return shelterRepository.save(shelter).getId();
    }

    /**
     * 대피소 대량 등록. 각 항목마다:
     * 1) depth 0/1/2 이름으로 기존 지역(depth 2)을 찾는다 — 없으면 실패(전체 롤백).
     * 2) address가 일치하는 place를 재사용하고, 없으면 새로 만든다.
     * 3) 그 place에 대피소 레코드를 붙여 저장한다.
     * name/englishName/description은 place와 shelter에 공통으로 채운다.
     * 위도/경도는 입력받지 않으므로 null로 저장하며, surveyStatus는 {@code NOT_INVESTIGATED}로 시작한다.
     * 한 항목이라도 실패하면 단일 트랜잭션으로 전체를 롤백한다.
     *
     * @return 생성된 대피소 ID 목록(입력 순서)
     */
    @Transactional
    public List<Long> bulkCreateShelters(List<AdminShelterBulkCreateItem> items) {
        // 같은 배치 안에서 지역/장소 재조회를 피하기 위한 캐시
        Map<String, Region> regionCache = new HashMap<>();
        Map<String, Place> placeByAddress = new HashMap<>();
        List<Long> createdIds = new ArrayList<>();

        for (int i = 0; i < items.size(); i++) {
            AdminShelterBulkCreateItem item = items.get(i);

            if (!StringUtils.hasText(item.name())) {
                throw new BadRequestException("대피소 이름은 필수입니다. (index=" + i + ")");
            }

            Region region = resolveRegion(item, regionCache, i);
            Place place = resolvePlace(item, region, placeByAddress);

            Shelter shelter = Shelter.builder()
                    .place(place)
                    .name(item.name())
                    .englishName(item.englishName())
                    .area(item.area())
                    .capacity(item.capacity())
                    .shelterType(item.shelterType())
                    .builtYear(item.builtYear())
                    .safetyGrade(item.safetyGrade())
                    .description(item.description())
                    .managingAuthorityName(item.managingAuthorityName())
                    .managingAuthorityTelNo(item.managingAuthorityTelNo())
                    .surveyStatus(ShelterSurveyStatus.NOT_INVESTIGATED)
                    .build();

            createdIds.add(shelterRepository.save(shelter).getId());
        }

        return createdIds;
    }

    private Region resolveRegion(AdminShelterBulkCreateItem item, Map<String, Region> regionCache, int index) {
        String key = item.depth0RegionName() + "|" + item.depth1RegionName() + "|" + item.depth2RegionName();
        return regionCache.computeIfAbsent(key, k ->
                regionRepository.findByRegionDepthAndRegionNameAndParent_RegionNameAndParent_Parent_RegionName(
                                2, item.depth2RegionName(), item.depth1RegionName(), item.depth0RegionName())
                        .orElseThrow(() -> new BadRequestException(
                                "일치하는 지역을 찾을 수 없습니다: " + item.depth0RegionName() + " "
                                        + item.depth1RegionName() + " " + item.depth2RegionName() + " (index=" + index + ")")));
    }

    private Place resolvePlace(AdminShelterBulkCreateItem item, Region region, Map<String, Place> placeByAddress) {
        String address = item.address();

        // 주소가 있으면 배치 캐시 → DB 순으로 재사용, 없으면 항상 새 place 생성
        if (StringUtils.hasText(address)) {
            Place cached = placeByAddress.get(address);
            if (cached != null) {
                return cached;
            }
            Place existing = placeRepository.findFirstByAddressOrderByIdAsc(address).orElse(null);
            if (existing != null) {
                placeByAddress.put(address, existing);
                return existing;
            }
        }

        Place place = placeRepository.save(Place.createForShelter(
                region,
                item.name(),
                item.englishName(),
                address,
                item.oldAddress(),
                item.englishAddress(),
                item.description(),
                null,
                null
        ));
        if (StringUtils.hasText(address)) {
            placeByAddress.put(address, place);
        }
        return place;
    }

    @Transactional
    public void updateAdminEditableFields(Long shelterId, AdminShelterUpdateRequest request) {
        Shelter shelter = shelterRepository.findById(shelterId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대피소 ID: " + shelterId));
        shelter.updateAdminEditableFields(
                request.name(),
                request.builtYear(),
                request.shelterType(),
                request.safetyGrade()
        );
    }
}

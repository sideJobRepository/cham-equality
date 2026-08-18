package com.chamapi.admin.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.admin.dto.request.AdminShelterBulkCreateItem;
import com.chamapi.admin.dto.request.AdminShelterCreateRequest;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.repository.RegionRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class AdminShelterServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private AdminShelterService adminShelterService;

    @Autowired
    private ShelterRepository shelterRepository;

    @Autowired
    private RegionRepository regionRepository;

    @DisplayName("createShelter - 주소를 지오코딩해 place/shelter가 생성된다")
    @Test
    void createShelter() {
        AdminShelterCreateRequest request = new AdminShelterCreateRequest(
                "우리집",                 // name
                "englishName",          // englishName
                "description",          // description
                1L,                   // regionId
                "충북 청주시 흥덕구 죽천로 146번길 6 복대 대원아파트 102동 201호",              // address (지오코딩 대상)
                "",           // oldAddress
                "",       // englishAddress
                null,                   // shelterType
                null,                   // area
                null,                   // capacity
                null,                   // builtYear
                null,                   // safetyGrade
                "managingAuthorityName",
                "managingAuthorityTelNo"
        );

        Long shelterId = adminShelterService.createShelter(request);

        Shelter shelter = shelterRepository.findById(shelterId).orElseThrow();
        assertThat(shelter.getPlace()).isNotNull();
        assertThat(shelter.getLatitude()).isNotNull();
        assertThat(shelter.getLongitude()).isNotNull();
    }

    @DisplayName("bulkCreateShelters - depth 0/1/2 지역이 존재하면 대피소가 생성되고 place에 해당 지역이 붙는다")
    @Test
    void bulkCreateShelters_success() {
        // 실제 DB를 사용하므로 시드 데이터와 충돌하지 않도록 고유한 테스트 지역명 사용
        Region depth0 = regionRepository.save(new Region(null, "테스트광역시도", "광역시도", 0, null, null));
        Region depth1 = regionRepository.save(new Region(depth0, "테스트시 테스트구", "시군구", 1, null, null));
        Region depth2 = regionRepository.save(new Region(depth1, "테스트동", "읍면동", 2, null, null));

        AdminShelterBulkCreateItem item = new AdminShelterBulkCreateItem(
                "테스트광역시도",          // depth0RegionName
                "테스트시 테스트구",        // depth1RegionName
                "테스트동",              // depth2RegionName
                "복대동 대피소",          // name
                "Bokdae Shelter",       // englishName
                "description",          // description
                "충북 청주시 흥덕구 죽천로 146번길 6", // address
                "복대동 123-4",          // oldAddress
                "english address",      // englishAddress
                null,                   // shelterType
                100,                    // area
                200,                    // capacity
                2000,                   // builtYear
                1,                      // safetyGrade
                "managingAuthorityName",
                "managingAuthorityTelNo"
        );

        List<Long> ids = adminShelterService.bulkCreateShelters(List.of(item));

        assertThat(ids).hasSize(1);
        Shelter shelter = shelterRepository.findById(ids.get(0)).orElseThrow();
        assertThat(shelter.getName()).isEqualTo("복대동 대피소");
        assertThat(shelter.getLatitude()).isNull();
        assertThat(shelter.getLongitude()).isNull();
        assertThat(shelter.getPlace()).isNotNull();
        assertThat(shelter.getPlace().getAddress()).isEqualTo("충북 청주시 흥덕구 죽천로 146번길 6");
        assertThat(shelter.getPlace().getRegion().getRegionId()).isEqualTo(depth2.getRegionId());
    }

    @DisplayName("bulkCreateShelters - depth 0/1/2 지역이 없으면 BadRequestException으로 실패한다")
    @Test
    void bulkCreateShelters_regionNotFound() {
        AdminShelterBulkCreateItem item = new AdminShelterBulkCreateItem(
                "없는광역시도",           // depth0RegionName
                "없는시군구",            // depth1RegionName
                "없는동",               // depth2RegionName
                "대피소",                // name
                "Shelter",              // englishName
                "description",          // description
                "어딘가 주소",           // address
                null,                   // oldAddress
                null,                   // englishAddress
                null,                   // shelterType
                null,                   // area
                null,                   // capacity
                null,                   // builtYear
                null,                   // safetyGrade
                null,                   // managingAuthorityName
                null                    // managingAuthorityTelNo
        );

        assertThatThrownBy(() -> adminShelterService.bulkCreateShelters(List.of(item)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("일치하는 지역을 찾을 수 없습니다");
    }
}

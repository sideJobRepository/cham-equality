package com.chamapi.admin.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.admin.dto.request.AdminShelterCreateRequest;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.repository.ShelterRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class AdminShelterServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private AdminShelterService adminShelterService;

    @Autowired
    private ShelterRepository shelterRepository;

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
}

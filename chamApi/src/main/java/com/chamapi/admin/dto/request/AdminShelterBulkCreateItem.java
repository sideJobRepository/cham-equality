package com.chamapi.admin.dto.request;

import com.chamapi.shelter.enums.ShelterType;

/**
 * 관리자 대피소 대량 등록 요청의 단일 항목.
 * region depth 0/1/2 이름으로 기존 지역을 찾고(없으면 실패), address가 일치하는 place를 재사용하거나 새로 만든 뒤,
 * 그 place에 대피소 레코드를 붙인다. name/englishName은 place와 shelter에 공통으로 채운다.
 * 위도/경도는 입력받지 않으며 null로 저장한다.
 */
public record AdminShelterBulkCreateItem(
        // region (기존 지역 조회용 — depth 0/1/2 이름)
        String depth0RegionName,
        String depth1RegionName,
        String depth2RegionName,

        // 공통(place & shelter)
        String name,
        String englishName,
        String description,

        // place 전용
        String address,
        String oldAddress,
        String englishAddress,

        // shelter 전용
        ShelterType shelterType,
        Integer area,
        Integer capacity,
        Integer builtYear,
        Integer safetyGrade,
        String managingAuthorityName,
        String managingAuthorityTelNo
) {}

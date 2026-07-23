package com.chamapi.admin.dto.request;

import com.chamapi.shelter.enums.ShelterType;

/**
 * 관리자 대피소 추가 요청.
 * 관리자는 place/shelter의 1:n 구조를 알 필요 없이 "대피소 하나"의 필드를 평평하게 입력하고,
 * 서버가 이를 {@code Place}(물리적 장소)와 {@code Shelter}(대피소 레코드)로 분배해 함께 생성한다.
 * name/englishName은 두 엔티티에 공통으로 채워진다.
 * 위도/경도는 입력받지 않고 주소를 지오코딩해 서버가 채운다.
 */
public record AdminShelterCreateRequest(
        // 공통(place & shelter)
        String name,
        String englishName,
        String description,

        // place 전용
        Long regionId,
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

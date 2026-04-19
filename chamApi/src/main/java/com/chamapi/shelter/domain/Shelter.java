package com.chamapi.shelter.domain;

import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.Getter;

@Entity
@Getter
public class Shelter extends DateSuperClass {

    @Id
    @GeneratedValue
    @Column(name = "SHELTER_ID")
    private Long id;

    @Column(name = "SHELTER_NAME")
    private String name; // 이름

    @Column(name = "SHELTER_ADDRESS")
    private String address; // 주소

    @Column(name = "SHELTER_LATITUDE")
    private double latitude; // 위도

    @Column(name = "SHELTER_LONGITUDE")
    private double longitude; // 경도

    @Column(name = "SHELTER_AREA")
    private double area; // 면적 m^2

    @Column(name = "SHELTER_CAPACITY")
    private int capacity; // 수용인원

    @Column(name = "SHELTER_BUILT_YEAR")
    private int builtYear; // 건축 연도

    @Column(name = "SHELTER_SAFETY_GRADE")
    private String safetyGrade; // 안전등급. TODO: 고정값이면 enum으로

    @Column(name = "SHELTER_DESCRIPTION")
    private String description; // 대피소 설명

    @Column(name = "SHELTER_MANAGING_AUTHORITY_NAME")
    private String managingAuthorityName; // 대피소 관리기관 이름

    @Column(name = "SHELTER_MANAGING_AUTHORITY_TEL_NO")
    private String managingAuthorityTelNo; // 대피소 관리기관 전화번호

    @Embedded
    private ShelterAccessibility accessibility;

}

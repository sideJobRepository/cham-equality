package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "SHELTER")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Shelter extends DateSuperClass {

    // 대피소 ID
    @Id
    @Column(name = "SHELTER_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 대피소 이름
    @Column(name = "SHELTER_NAME")
    private String name;

    // 대피소 주소
    @Column(name = "SHELTER_ADDRESS")
    private String address;

    // 대피소 위도
    @Column(name = "SHELTER_LATITUDE")
    private String latitude;

    // 대피소 경도
    @Column(name = "SHELTER_LONGITUDE")
    private String longitude;

    // 대피소 면적
    @Column(name = "SHELTER_AREA")
    private Integer area;

    // 대피소 수용인원
    @Column(name = "SHELTER_CAPACITY")
    private Integer capacity;

    // 대피소 건축 연도
    @Column(name = "SHELTER_BUILT_YEAR")
    private Integer builtYear;

    // 대피소 안전 등급
    @Column(name = "SHELTER_SAFETY_GRADE")
    private Integer safetyGrade;

    // 대피소 설명
    @Column(name = "SHELTER_DESCRIPTION", columnDefinition = "TEXT")
    private String description;

    // 대피소 관리 기관 이름
    @Column(name = "SHELTER_MANAGING_AUTHORITY_NAME")
    private String managingAuthorityName;

    // 대피소 관리 기관 전화 번호
    @Column(name = "SHELTER_MANAGING_AUTHORITY_TEL_NO")
    private String managingAuthorityTelNo;

    // 대피소 안내문 언어
    @Column(name = "SHELTER_SIGNAGE_LANGUAGE")
    private String shelterSignageLanguage;

    // 대피소 장애인용 화장실 여부
    @Column(name = "SHELTER_ACCESSIBLE_TOILET_WHETHER")
    private Boolean accessibleToiletWhether;

    // 대피소 경사로 여부
    @Column(name = "SHELTER_RAMP_WHETHER")
    private Boolean rampWhether;
    
    // 대피소 기타 접근성 시설
    @Column(name = "SHELTER_ETC_ACCESSIBILITY_FACILITIES")
    private String etcAccessibilityFacilities;

    // 대피소 엘리베이터 여부
    @Column(name = "SHELTER_ELEVATOR_WHETHER")
    private Boolean elevatorWhether;

    // 대피소 점자 블록 여부
    @Column(name = "SHELTER_BRAILLE_BLOCK_WHETHER")
    private Boolean brailleBlockWhether;
}

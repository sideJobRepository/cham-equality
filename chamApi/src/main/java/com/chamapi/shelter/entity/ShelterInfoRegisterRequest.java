package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.shelter.enums.ShelterInfoRegisterRequestStatus;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "SHELTER_INFO_REGISTER_REQUEST")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ShelterInfoRegisterRequest extends DateSuperClass {

    // 대피소 정보 등록 요청 ID
    @Id
    @Column(name = "SHELTER_INFO_REGISTER_REQUEST_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 대피소 ID
    @Column(name = "SHELTER_ID")
    private Long shelterId;

    // 현장 확인 시설명
    @Column(name = "SHELTER_NAME")
    private String name;

    // 건축 연도
    @Column(name = "SHELTER_BUILT_YEAR")
    private Integer builtYear;

    // 안전 등급(내진설계)
    @Column(name = "SHELTER_SAFETY_GRADE")
    private Integer safetyGrade;

    // 장애인 화장실 여부
    @Column(name = "SHELTER_ACCESSIBLE_TOILET_WHETHER")
    private Boolean accessibleToiletWhether;

    // 경사로 여부
    @Column(name = "SHELTER_RAMP_WHETHER")
    private Boolean rampWhether;

    // 엘리베이터 여부
    @Column(name = "SHELTER_ELEVATOR_WHETHER")
    private Boolean elevatorWhether;
    
    // 대피소 기타 접근성 시설
    @Column(name = "SHELTER_ETC_ACCESSIBILITY_FACILITIES")
    private String etcAccessibilityFacilities;

    // 점자 블록 여부
    @Column(name = "SHELTER_BRAILLE_BLOCK_WHETHER")
    private Boolean brailleBlockWhether;

    // 안내문 언어
    @Column(name = "SHELTER_SIGNAGE_LANGUAGE")
    private String signageLanguage;

    // 조사자 메모
    @Column(name = "REQUEST_NOTE", length = 4000)
    private String requestNote;

    // 요청 상태
    @Enumerated(EnumType.STRING)
    @Column(name = "REQUEST_STATUS")
    private ShelterInfoRegisterRequestStatus requestStatus;
}

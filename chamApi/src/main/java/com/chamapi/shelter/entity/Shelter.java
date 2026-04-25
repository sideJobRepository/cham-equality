package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.enums.ShelterType;
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

    // 대피소 구 주소
    @Column(name = "SHELTER_OLD_ADDRESS")
    private String oldAddress;

    // 대피소 타입
    @Column(name = "SHELTER_TYPE")
    @Enumerated(EnumType.STRING)
    private ShelterType shelterType;

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
    private String signageLanguage;

    // 대피소 이동약자 편의시설
    @Embedded
    private ShelterAccessibility accessibility;

    // 대피소 조사 상태(시민 제출 가능 여부 게이트)
    @Column(name = "SHELTER_SURVEY_STATUS")
    @Enumerated(EnumType.STRING)
    private ShelterSurveyStatus surveyStatus;

    public void applyReport(ShelterInfoReport report) {
        if (report.getSignageLanguage() != null) this.signageLanguage = report.getSignageLanguage();
        if (report.getAccessibility() != null) this.accessibility = report.getAccessibility();
        this.surveyStatus = ShelterSurveyStatus.INVESTIGATED;
    }

    public void markReInvestigation() {
        this.surveyStatus = ShelterSurveyStatus.RE_INVESTIGATION;
    }

    public void updateAdminEditableFields(String name, Integer builtYear, ShelterType shelterType, Integer safetyGrade) {
        this.name = name;
        this.builtYear = builtYear;
        this.shelterType = shelterType;
        this.safetyGrade = safetyGrade;
    }
}

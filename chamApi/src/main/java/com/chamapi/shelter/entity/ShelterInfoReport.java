package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;


@Table(name = "SHELTER_INFO_REPORT")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ShelterInfoReport extends DateSuperClass {


    // 대피소 정보 등록 요청 ID
    @Id
    @Column(name = "SHELTER_INFO_REPORT_ID")
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

    // 안내문 언어
    @Column(name = "SHELTER_SIGNAGE_LANGUAGE")
    private String signageLanguage;

    // 대피소 이동약자 편의시설
    @Embedded
    private ShelterAccessibility accessibility;

    // 조사자 메모
    @Column(name = "REPORT_NOTE")
    private String requestNote;

    // 요청 상태
    @Enumerated(EnumType.STRING)
    @Column(name = "REPORT_STATUS")
    private ShelterInfoReportStatus requestStatus;

    public void approve() {
        this.requestStatus = ShelterInfoReportStatus.APPROVED;
    }

    public void reject() {
        this.requestStatus = ShelterInfoReportStatus.REJECTED;
    }
}

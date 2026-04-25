package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.common.exception.BadRequestException;
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

    public void update(
            String signageLanguage,
            Boolean accessibleToilet,
            Boolean ramp,
            Boolean elevator,
            Boolean brailleBlock,
            String etcFacilities,
            String requestNote
    ) {
        this.signageLanguage = signageLanguage;
        this.accessibility = ShelterAccessibility.builder()
                .accessibleToilet(accessibleToilet)
                .ramp(ramp)
                .elevator(elevator)
                .brailleBlock(brailleBlock)
                .etcFacilities(etcFacilities)
                .build();
        this.requestNote = requestNote;
    }

    public void verifyPending() {
        if (this.requestStatus != ShelterInfoReportStatus.PENDING) {
            throw new BadRequestException("대기 중인 리포트만 수정 가능합니다");
        }
    }
}

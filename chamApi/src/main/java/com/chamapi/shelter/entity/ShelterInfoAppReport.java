package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

/**
 * 앱에서 로그인한 시민이 제출하는 대피소 정보 제보.
 * 항상 기존 대피소({@code shelterId}) 보완 제보이며, 제보자는 JWT의 {@code memberId}로 식별한다.
 * 승인/반려는 관리자(기존 관리자 웹) 몫이라 이 도메인엔 상태 전이 메서드가 없다.
 */
@Table(name = "SHELTER_INFO_APP_REPORT")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ShelterInfoAppReport extends DateSuperClass {

    // 대피소 정보 앱 제보 ID
    @Id
    @Column(name = "SHELTER_INFO_APP_REPORT_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 대피소 ID(보완 대상 기존 대피소)
    @Column(name = "SHELTER_ID")
    private Long shelterId;

    // 제보자 회원 ID
    @Column(name = "MEMBER_ID")
    private Long memberId;

    // 안내문 언어
    @Column(name = "SHELTER_SIGNAGE_LANGUAGE")
    private String signageLanguage;

    // 대피소 이동약자 편의시설
    @Embedded
    private ShelterAccessibility accessibility;

    // 제보 상태
    @Enumerated(EnumType.STRING)
    @Column(name = "REPORT_STATUS")
    private ShelterInfoReportStatus requestStatus;

    public void update(
            String signageLanguage,
            Boolean accessibleToilet,
            Boolean ramp,
            Boolean elevator,
            Boolean brailleBlock,
            String etcFacilities
    ) {
        this.signageLanguage = signageLanguage;
        this.accessibility = ShelterAccessibility.builder()
                .accessibleToilet(accessibleToilet)
                .ramp(ramp)
                .elevator(elevator)
                .brailleBlock(brailleBlock)
                .etcFacilities(etcFacilities)
                .build();
    }

    public void verifyPending() {
        if (this.requestStatus != ShelterInfoReportStatus.PENDING) {
            throw new BadRequestException("대기 중인 제보만 수정 가능합니다");
        }
    }
}

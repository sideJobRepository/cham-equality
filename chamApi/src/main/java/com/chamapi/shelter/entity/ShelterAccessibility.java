package com.chamapi.shelter.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ShelterAccessibility {

    // 장애인용 화장실 여부
    @Column(name = "SHELTER_ACCESSIBLE_TOILET_WHETHER")
    private Boolean accessibleToilet;

    // 경사로 여부
    @Column(name = "SHELTER_RAMP_WHETHER")
    private Boolean ramp;

    // 엘리베이터 여부
    @Column(name = "SHELTER_ELEVATOR_WHETHER")
    private Boolean elevator;

    // 점자 블록 여부
    @Column(name = "SHELTER_BRAILLE_BLOCK_WHETHER")
    private Boolean brailleBlock;

    // 기타 접근성 시설
    @Column(name = "SHELTER_ETC_ACCESSIBILITY_FACILITIES")
    private String etcFacilities;
}

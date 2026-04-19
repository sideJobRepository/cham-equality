package com.chamapi.shelter.domain;

import jakarta.persistence.*;
import lombok.Getter;

import java.util.List;

@Getter
@Embeddable
public class ShelterAccessibility {

    @ElementCollection
    @Column(name = "SHELTER_SIGNAGE_LANGUAGES")
    private List<String> signageLanguages; // 안내문 병기된 외국어 종류

    @Column(name = "SHELTER_ACCESSIBLE_TOILET_WHETHER")
    private boolean accessibleToilet; // 장애인화장실 여부

    @Column(name = "SHELTER_RAMP_WHETHER")
    private boolean ramp; // 경사로 여부

    @Column(name = "SHELTER_ELEVATOR_WHETHER")
    private boolean elevator; // 엘리베이터 여부

    @Column(name = "SHELTER_BRAILLE_BLOCK_WHETHER")
    private boolean brailleBlock; // 점자블록 여부

    @Column(name = "SHELTER_MAX_WHEELCHAIR_WIDTH")
    private int maxWheelchairWidthCm; // 이용 가능한 휠체어 최대 너비

}

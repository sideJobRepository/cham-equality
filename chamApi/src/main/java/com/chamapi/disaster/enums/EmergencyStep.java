package com.chamapi.disaster.enums;

import java.util.Arrays;

/**
 * 긴급단계 (safetydata.go.kr EMRG_STEP_NM)
 * 미식별 값은 ETC 로 매핑하여 외부 API가 새 단계를 추가해도 저장이 깨지지 않도록 함.
 */
public enum EmergencyStep {

    CRITICAL("위급재난"),
    EMERGENCY("긴급재난"),
    ADVISORY("안전안내"),
    ETC("");

    private final String label;

    EmergencyStep(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static EmergencyStep fromLabel(String label) {
        if (label == null) return ETC;
        return Arrays.stream(values())
                .filter(s -> s.label.equals(label.trim()))
                .findFirst()
                .orElse(ETC);
    }
}

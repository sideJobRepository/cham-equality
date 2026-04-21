package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.entity.ShelterInfoReport;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;

import java.time.LocalDateTime;

public record ShelterReportListResponse(
        Long id,
        Long shelterId,
        String name,
        Integer builtYear,
        Integer safetyGrade,
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        String requestNote,
        ShelterInfoReportStatus requestStatus,
        LocalDateTime createDate
) {
    public static ShelterReportListResponse from(ShelterInfoReport r) {
        ShelterAccessibility a = r.getAccessibility();
        return new ShelterReportListResponse(
                r.getId(),
                r.getShelterId(),
                r.getName(),
                r.getBuiltYear(),
                r.getSafetyGrade(),
                r.getSignageLanguage(),
                a != null ? a.getAccessibleToilet() : null,
                a != null ? a.getRamp() : null,
                a != null ? a.getElevator() : null,
                a != null ? a.getBrailleBlock() : null,
                a != null ? a.getEtcFacilities() : null,
                r.getRequestNote(),
                r.getRequestStatus(),
                r.getCreateDate()
        );
    }
}

package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.entity.ShelterInfoAppReport;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;

import java.time.LocalDateTime;

public record ShelterAppReportListResponse(
        Long id,
        Long shelterId,
        String shelterName,
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        ShelterInfoReportStatus requestStatus,
        LocalDateTime createDate
) {
    public static ShelterAppReportListResponse from(ShelterInfoAppReport r, String shelterName) {
        ShelterAccessibility a = r.getAccessibility();
        return new ShelterAppReportListResponse(
                r.getId(),
                r.getShelterId(),
                shelterName,
                r.getSignageLanguage(),
                a != null ? a.getAccessibleToilet() : null,
                a != null ? a.getRamp() : null,
                a != null ? a.getElevator() : null,
                a != null ? a.getBrailleBlock() : null,
                a != null ? a.getEtcFacilities() : null,
                r.getRequestStatus(),
                r.getCreateDate()
        );
    }
}

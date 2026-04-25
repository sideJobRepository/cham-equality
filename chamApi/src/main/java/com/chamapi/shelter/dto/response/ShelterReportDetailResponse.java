package com.chamapi.shelter.dto.response;

import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.entity.ShelterInfoReport;
import com.chamapi.shelter.enums.ShelterImageCategory;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.enums.ShelterSurveyStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ShelterReportDetailResponse(
        Long id,
        Long shelterId,
        String shelterName,
        String shelterAddress,
        ShelterSurveyStatus shelterSurveyStatus,
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        String requestNote,
        ShelterInfoReportStatus requestStatus,
        LocalDateTime createDate,
        List<ImageView> images
) {

    public record ImageView(
            Long fileId,
            ShelterImageCategory category,
            String description,
            String url,
            String fileName
    ) {}

    public static ShelterReportDetailResponse of(
            ShelterInfoReport r,
            Shelter shelter,
            List<ImageView> images
    ) {
        ShelterAccessibility a = r.getAccessibility();
        return new ShelterReportDetailResponse(
                r.getId(),
                r.getShelterId(),
                shelter != null ? shelter.getName() : null,
                shelter != null ? shelter.getAddress() : null,
                shelter != null ? shelter.getSurveyStatus() : null,
                r.getSignageLanguage(),
                a != null ? a.getAccessibleToilet() : null,
                a != null ? a.getRamp() : null,
                a != null ? a.getElevator() : null,
                a != null ? a.getBrailleBlock() : null,
                a != null ? a.getEtcFacilities() : null,
                r.getRequestNote(),
                r.getRequestStatus(),
                r.getCreateDate(),
                images
        );
    }
}

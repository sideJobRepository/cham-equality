package com.chamapi.shelter.dto.response;

import com.chamapi.place.entity.Place;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.entity.ShelterInfoReport;
import com.chamapi.shelter.enums.ShelterImageCategory;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.enums.ShelterSurveyStatus;

import java.time.LocalDateTime;
import java.util.List;

import static com.chamapi.common.util.NullSafe.mapOrNull;

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
        String reporter,
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
        Place p = mapOrNull(shelter, Shelter::getPlace);
        return new ShelterReportDetailResponse(
                r.getId(),
                r.getShelterId(),
                mapOrNull(shelter, Shelter::getName),
                mapOrNull(p, Place::getAddress),
                mapOrNull(shelter, Shelter::getSurveyStatus),
                r.getSignageLanguage(),
                mapOrNull(a, ShelterAccessibility::getAccessibleToilet),
                mapOrNull(a, ShelterAccessibility::getRamp),
                mapOrNull(a, ShelterAccessibility::getElevator),
                mapOrNull(a, ShelterAccessibility::getBrailleBlock),
                mapOrNull(a, ShelterAccessibility::getEtcFacilities),
                r.getReporter(),
                r.getRequestNote(),
                r.getRequestStatus(),
                r.getCreateDate(),
                images
        );
    }
}

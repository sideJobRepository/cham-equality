package com.chamapi.shelter.dto.request;

import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.entity.ShelterInfoReport;
import com.chamapi.shelter.enums.ShelterImageCategory;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;

import java.util.List;

public record ShelterInfoReportCreateRequest(
        Long shelterId,
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        String requestNote,
        List<ImageItem> images
) {

    public record ImageItem(
            Long fileId,
            ShelterImageCategory category,
            String description
    ) {}

    public ShelterInfoReport toEntity() {
        return ShelterInfoReport.builder()
                .shelterId(shelterId)
                .signageLanguage(signageLanguage)
                .accessibility(ShelterAccessibility.builder()
                        .accessibleToilet(accessibleToilet)
                        .ramp(ramp)
                        .elevator(elevator)
                        .brailleBlock(brailleBlock)
                        .etcFacilities(etcFacilities)
                        .build())
                .requestNote(requestNote)
                .requestStatus(ShelterInfoReportStatus.PENDING)
                .build();
    }
}

package com.chamapi.shelter.dto.request;

import com.chamapi.file.enums.FileProcessStatus;
import com.chamapi.shelter.enums.ShelterImageCategory;

import java.util.List;

public record ShelterInfoReportUpdateRequest(
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        String requestNote,
        List<ImageChange> imageChanges
) {

    public record ImageChange(
            Long fileId,
            FileProcessStatus status,
            ShelterImageCategory category,
            String description
    ) {}
}

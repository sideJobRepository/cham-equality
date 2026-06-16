package com.chamapi.shelter.dto.request;

import com.chamapi.file.enums.FileProcessStatus;
import com.chamapi.shelter.enums.ShelterImageCategory;

import java.util.List;

/**
 * 앱 시민 본인 제보 수정 요청. 웹 제보 수정({@code ShelterInfoReportUpdateRequest})에서
 * reporter/requestNote만 뺀 형태. 이미지 변경은 CREATE(새 업로드 연결)/DELETE(기존 제거)로 들어온다.
 */
public record ShelterInfoAppReportUpdateRequest(
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        List<ImageChange> imageChanges
) {

    public record ImageChange(
            Long fileId,
            FileProcessStatus status,
            ShelterImageCategory category,
            String description
    ) {}
}

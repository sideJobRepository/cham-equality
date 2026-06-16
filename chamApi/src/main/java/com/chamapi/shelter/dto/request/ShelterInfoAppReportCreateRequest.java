package com.chamapi.shelter.dto.request;

import com.chamapi.shelter.entity.ShelterAccessibility;
import com.chamapi.shelter.entity.ShelterInfoAppReport;
import com.chamapi.shelter.enums.ShelterImageCategory;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;

import java.util.List;

/**
 * 앱 시민 제보 생성 요청. 제보자는 신뢰하지 않고 JWT에서 추출한 {@code memberId}로 채운다
 * (요청 본문에 reporter/memberId를 받지 않는다).
 */
public record ShelterInfoAppReportCreateRequest(
        Long shelterId,
        String signageLanguage,
        Boolean accessibleToilet,
        Boolean ramp,
        Boolean elevator,
        Boolean brailleBlock,
        String etcFacilities,
        List<ImageItem> images
) {

    public record ImageItem(Long fileId, ShelterImageCategory category, String description) {}

    public ShelterInfoAppReport toEntity(Long memberId) {
        return ShelterInfoAppReport.builder()
                .shelterId(shelterId)
                .memberId(memberId)
                .signageLanguage(signageLanguage)
                .accessibility(ShelterAccessibility.builder()
                        .accessibleToilet(accessibleToilet)
                        .ramp(ramp)
                        .elevator(elevator)
                        .brailleBlock(brailleBlock)
                        .etcFacilities(etcFacilities)
                        .build())
                .requestStatus(ShelterInfoReportStatus.PENDING)
                .build();
    }
}

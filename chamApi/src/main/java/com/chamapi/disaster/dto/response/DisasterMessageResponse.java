package com.chamapi.disaster.dto.response;

import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;

import java.time.LocalDateTime;

public record DisasterMessageResponse(Long id, Long sn, String content, String regionName, EmergencyStep emergencyStep, String emergencyStepLabel, String category, LocalDateTime issuedAt
) {
    public static DisasterMessageResponse from(DisasterMessage m) {
        return from(m, m.getContent());
    }

    /** content 를 요청 언어 번역문으로 대체해 반환 (배너 다국어용). 카테고리는 원문 유지. */
    public static DisasterMessageResponse from(DisasterMessage m, String content) {
        return from(m, content, m.getCategory());
    }

    /** content·category 를 요청 언어 번역문으로 대체해 반환 (배너 다국어용). */
    public static DisasterMessageResponse from(DisasterMessage m, String content, String category) {
        return new DisasterMessageResponse(
                m.getId(),
                m.getSn(),
                content,
                m.getRegionName(),
                m.getEmergencyStep(),
                m.getEmergencyStep().getLabel(),
                category,
                m.getIssuedAt()
        );
    }
}

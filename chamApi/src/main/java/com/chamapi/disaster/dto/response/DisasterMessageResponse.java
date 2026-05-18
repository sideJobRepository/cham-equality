package com.chamapi.disaster.dto.response;

import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;

import java.time.LocalDateTime;

public record DisasterMessageResponse(Long id, Long sn, String content, String regionName, EmergencyStep emergencyStep, String emergencyStepLabel, String category, LocalDateTime issuedAt
) {
    public static DisasterMessageResponse from(DisasterMessage m) {
        return new DisasterMessageResponse(
                m.getId(),
                m.getSn(),
                m.getContent(),
                m.getRegionName(),
                m.getEmergencyStep(),
                m.getEmergencyStep().getLabel(),
                m.getCategory(),
                m.getIssuedAt()
        );
    }
}

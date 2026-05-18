package com.chamapi.disaster.service.impl;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.disaster.config.SafetyDataProperties;
import com.chamapi.disaster.dto.response.ActiveDisasterResponse;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;
import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;
import com.chamapi.disaster.repository.DisasterMessageRepository;
import com.chamapi.disaster.service.DisasterMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

@Transactional(readOnly = true)
@Service
@RequiredArgsConstructor
public class DisasterMessageServiceImpl implements DisasterMessageService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final long ACTIVE_WINDOW_HOURS = 6L;
    private static final List<EmergencyStep> ALERT_STEPS = List.of(EmergencyStep.CRITICAL, EmergencyStep.EMERGENCY, EmergencyStep.ADVISORY);

    private final DisasterMessageRepository repository;
    private final SafetyDataProperties properties;

    @Override
    public ActiveDisasterResponse findActive() {
        LocalDateTime now = LocalDateTime.now(KST);
        LocalDateTime since = now.minusHours(ACTIVE_WINDOW_HOURS);
        List<DisasterMessage> active = repository.findActive(properties.getRegion(), ALERT_STEPS, since);
        if (active.isEmpty()) {
            return ActiveDisasterResponse.inactive(now);
        }
        return ActiveDisasterResponse.active(now, DisasterMessageResponse.from(active.get(0)));
    }

    @Override
    public DisasterMessageResponse findOne(Long id) {
        DisasterMessage m = repository.findById(id).orElseThrow(() -> new BadRequestException("재난문자를 찾을 수 없습니다."));
        return DisasterMessageResponse.from(m);
    }
}

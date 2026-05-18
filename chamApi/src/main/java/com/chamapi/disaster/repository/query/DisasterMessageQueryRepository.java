package com.chamapi.disaster.repository.query;

import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface DisasterMessageQueryRepository {

    Set<Long> findExistingSns(List<Long> sns);

    List<DisasterMessage> findActive(String region, List<EmergencyStep> steps, LocalDateTime since);
}

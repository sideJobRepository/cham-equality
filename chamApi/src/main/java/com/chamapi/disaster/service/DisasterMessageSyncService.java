package com.chamapi.disaster.service;

import com.chamapi.disaster.client.SafetyDataClient;
import com.chamapi.disaster.config.SafetyDataProperties;
import com.chamapi.disaster.dto.external.SafetyDataItem;
import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;
import com.chamapi.disaster.repository.DisasterMessageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * safetydata.go.kr 긴급재난문자를 주기적으로 가져와 신규 항목만 적재.
 * 호출자(스케줄러)에서 try/catch 없이 호출해도 sync() 자체가 외부 장애를 흡수.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DisasterMessageSyncService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final DateTimeFormatter ISSUED_AT_FORMAT = DateTimeFormatter.ofPattern("yyyy/MM/dd HH:mm:ss");
    private static final int MAX_PAGES = 50;

    private final SafetyDataClient client;
    private final DisasterMessageRepository repository;
    private final SafetyDataProperties properties;

    @Transactional
    public int sync() {
        LocalDate today = LocalDate.now(KST);
        int days = Math.max(1, properties.getSyncDays());
        int totalInserted = 0;
        for (int offset = days - 1; offset >= 0; offset--) {
            totalInserted += syncDay(today.minusDays(offset));
        }
        return totalInserted;
    }

    private int syncDay(LocalDate date) {
        String region = properties.getRegion();
        List<SafetyDataItem> items = client.fetchAll(date, region, MAX_PAGES);
        if (items.isEmpty()) return 0;

        List<DisasterMessage> candidates = items.stream()
                .map(this::toEntity)
                .filter(java.util.Objects::nonNull)
                .filter(m -> m.getRegionName().contains(region))
                .collect(Collectors.collectingAndThen(
                        Collectors.toMap(
                                DisasterMessage::getSn,
                                m -> m,
                                (a, b) -> a,
                                LinkedHashMap::new),
                        m -> new ArrayList<>(m.values())));

        if (candidates.isEmpty()) return 0;

        List<Long> sns = candidates.stream().map(DisasterMessage::getSn).toList();
        Set<Long> existing = repository.findExistingSns(sns);

        List<DisasterMessage> toInsert = candidates.stream()
                .filter(m -> !existing.contains(m.getSn()))
                .toList();

        if (toInsert.isEmpty()) return 0;

        repository.saveAll(toInsert);
        log.info("disaster message sync inserted={} date={} region={}", toInsert.size(), date, region);
        return toInsert.size();
    }

    private DisasterMessage toEntity(SafetyDataItem item) {
        if (item.sn() == null || item.content() == null || item.regionName() == null) {
            return null;
        }
        LocalDateTime issuedAt = parseIssuedAt(item.createdAt());
        if (issuedAt == null) {
            log.debug("skipping item sn={} due to unparsable CRT_DT={}", item.sn(), item.createdAt());
            return null;
        }
        return DisasterMessage.builder()
                .sn(item.sn())
                .content(item.content())
                .regionName(item.regionName().trim())
                .emergencyStep(EmergencyStep.fromLabel(item.emergencyStep()))
                .category(item.category())
                .issuedAt(issuedAt)
                .build();
    }

    private LocalDateTime parseIssuedAt(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value.trim(), ISSUED_AT_FORMAT);
        } catch (DateTimeParseException e) {
            return null;
        }
    }
}

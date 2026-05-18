package com.chamapi.disaster.schedule;

import com.chamapi.disaster.service.DisasterMessageSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DisasterMessageSchedule {

    private final DisasterMessageSyncService syncService;

    /** 매 5분 정각(00, 05, 10, ...)에 safetydata.go.kr 동기화. */
    @Scheduled(cron = "0 */5 * * * *", zone = "Asia/Seoul")
    public void run() {
        try {
            syncService.sync();
        } catch (Exception e) {
            log.warn("disaster message sync failed: {}", e.getMessage());
        }
    }
}

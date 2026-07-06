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

//    /** [테스트용] 10초마다 safetydata.go.kr 동기화 후 미번역분 재시도 번역. 운영 복귀 시 "0 */5 * * * *" 로 원복. */
    @Scheduled(cron = "0 */5 * * * *", zone = "Asia/Seoul")
    public void run() {
        try {
            syncService.sync();
        } catch (Exception e) {
            log.warn("disaster message sync failed: {}", e.getMessage());
        }
        try {
            syncService.translateUntranslated();
        } catch (Exception e) {
            log.warn("disaster message translation retry failed: {}", e.getMessage());
        }
    }
}

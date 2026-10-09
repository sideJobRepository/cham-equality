package com.chamapi.disaster.schedule;

import com.chamapi.disaster.service.DisasterMessageSyncService;
import com.chamapi.push.service.DisasterPushService;
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
    private final DisasterPushService disasterPushService;
    
   // @Scheduled(cron = "*/10 * * * * *", zone = "Asia/Seoul")
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
        // 적재·번역이 각자 커밋된 뒤에 보내야 번역문을 쓸 수 있고 롤백된 문자가 나가지 않는다.
        try {
            disasterPushService.sendPending();
        } catch (Exception e) {
            log.warn("disaster push failed: {}", e.getMessage());
        }
    }
}

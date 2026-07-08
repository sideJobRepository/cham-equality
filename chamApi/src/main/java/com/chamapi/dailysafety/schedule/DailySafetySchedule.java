package com.chamapi.dailysafety.schedule;

import com.chamapi.dailysafety.service.DailySafetyTranslationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("!test")
@RequiredArgsConstructor
@Slf4j
public class DailySafetySchedule {

    private final DailySafetyTranslationService translationService;

    /** [테스트용] 10초마다 미번역 일일 재난안전 요약을 번역. 운영 복귀 시 "0 0 * * * *" 로 원복. */
  //  @Scheduled(cron = "*/10 * * * * *", zone = "Asia/Seoul")
    @Scheduled(cron = "0 0 * * * *", zone = "Asia/Seoul")
    public void run() {
        try {
            translationService.translateUntranslated();
        } catch (Exception e) {
            log.warn("daily safety translation failed: {}", e.getMessage());
        }
    }
}

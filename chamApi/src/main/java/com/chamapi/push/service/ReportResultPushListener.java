package com.chamapi.push.service;

import com.chamapi.shelter.event.AppReportDecidedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 앱 제보 승인·반려가 커밋된 뒤 제보한 회원에게 결과 알림을 보낸다.
 * 커밋 뒤라 롤백된 처리는 알리지 않고, 푸시가 실패해도 처리 결과는 그대로다.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ReportResultPushListener {

    private final MemberPushService memberPushService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onDecided(AppReportDecidedEvent event) {
        try {
            memberPushService.sendReportResult(event.memberId(), event.reportId(), event.shelterName(), event.result());
        } catch (RuntimeException e) {
            log.warn("report result push skipped reportId={} reason={}", event.reportId(), e.getMessage());
        }
    }
}

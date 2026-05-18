package com.chamapi.disaster.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.disaster.dto.response.ActiveDisasterResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class DisasterMessageSyncServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private DisasterMessageSyncService syncService;

    @Autowired
    private DisasterMessageService disasterMessageService;

    @DisplayName("실제 safetydata.go.kr API 호출해서 동기화")
    @Test
    void test1() {
        int inserted = syncService.sync();
        System.out.println("inserted = " + inserted);
    }

    @DisplayName("동기화 후 활성 재난문자 조회")
    @Test
    void test2() {
        syncService.sync();
        ActiveDisasterResponse response = disasterMessageService.findActive();
        System.out.println("active = " + response.active());
        System.out.println("message = " + response.message());
    }
}

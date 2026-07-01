package com.chamapi.disaster.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

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

    @DisplayName("동기화 후 최신 재난문자 5건 조회")
    @Test
    void test2() {
        syncService.sync();
        List<DisasterMessageResponse> latest = disasterMessageService.findLatest();
        System.out.println("size = " + latest.size());
        latest.forEach(m -> System.out.println("message = " + m));
    }
}

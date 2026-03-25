package com.chamapi.file.schedule;


import com.chamapi.file.service.FileBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Component
@Transactional
public class CommonFileSchedule {
    
    private final FileBatchService fileBatchService;
    
    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;
    
    /**
     * 매일 새벽 1시에 실행
     */
    @Scheduled(cron = "0 0 1 * * *", zone = "Asia/Seoul")
    public void scheduled() {
        LocalDateTime targetTime = LocalDateTime.now().minusDays(1);
        fileBatchService.temporaryFileRemove(targetTime,bucket);
    }
}

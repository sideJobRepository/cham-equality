package com.chamapi.file.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Value;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

class FileBatchServiceTest extends RepositoryAndServiceTestSupport {

    
    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;
    
    @DisplayName("임시(TEMPORARY) 이면서 DB에 저장한지 하루가 지난 파일 삭제")
    @Test
    void test1(){
        LocalDateTime targetTime = LocalDateTime.now().minusDays(1);
        fileBatchService.temporaryFileRemove(targetTime,bucket);
    }
}
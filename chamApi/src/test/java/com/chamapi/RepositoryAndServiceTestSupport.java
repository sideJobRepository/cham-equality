package com.chamapi;

import com.chamapi.file.service.FileBatchService;
import com.chamapi.file.service.S3FileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
public abstract class RepositoryAndServiceTestSupport {
    
    @Autowired
    protected S3FileService s3FileService;
    
    @Autowired
    protected FileBatchService fileBatchService;
}

package com.chamapi.file;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.file.request.UploadRequest;
import com.chamapi.file.response.PresignedUrlResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class S3FileServiceTest extends RepositoryAndServiceTestSupport {
    
    
    @DisplayName("")
    @Test
    void test1() throws IOException {
        //given //when
        UploadRequest uploadRequest = UploadRequest
                .builder()
                .fileName("이건 모자가 아니잖아.jpg")
                .build();
        
        PresignedUrlResponse uploadPresignedUrl = s3FileService.getUploadPresignedUrl(uploadRequest);
        //then
        System.out.println("uploadPresignedUrl = " + uploadPresignedUrl);
        
    }
}
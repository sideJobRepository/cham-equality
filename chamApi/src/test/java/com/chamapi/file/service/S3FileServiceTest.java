package com.chamapi.file.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.file.dto.request.FileUploadInfo;
import com.chamapi.file.dto.request.UploadRequest;
import com.chamapi.file.dto.response.FileUploadResponse;
import com.chamapi.file.dto.response.PresignedUrlResponse;
import com.chamapi.file.enums.FileType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.util.List;

class S3FileServiceTest extends RepositoryAndServiceTestSupport {
    
    
    @DisplayName("프리 사이드 url 발급")
    @Test
    void test1() throws IOException {
        //given //when
        FileUploadInfo build1 = FileUploadInfo
                .builder()
                .fileName("이건 모자가 아니잖아.jpg")
                .contentType("image/jpeg")
                .build();
        
        FileUploadInfo build2 = FileUploadInfo
                .builder()
                .fileName("이건 모자가 아니잖아2.jpg")
                .contentType("image/jpeg")
                .build();
        
        List<FileUploadInfo> build3 = List.of(build1,build2);
        
        UploadRequest uploadRequest = UploadRequest
                .builder()
                .files (build3)
                .build();
        
        List<PresignedUrlResponse> uploadPresignedUrl = s3FileService.getUploadPresignedUrl(uploadRequest);
        //then
        System.out.println("uploadPresignedUrl = " + uploadPresignedUrl);
    }
    @DisplayName("프론트에서 s3 업로드후 db 저장하기 위해 upload-file 호출")
    @Test
    void test2(){
        // given
        FileUploadInfo file1 = FileUploadInfo.builder()
                .fileName("test1.jpg")
                .contentType("image/jpeg")
                .fileSize(12345)
                .objectKey("test1-uuid.jpg") // presigned 결과라고 가정
                .bucketName("test")
                .build();
        
        FileUploadInfo file2 = FileUploadInfo.builder()
                .fileName("test2.jpg")
                .contentType("image/jpeg")
                .fileSize(54321)
                .objectKey("test2-uuid.jpg")
                .bucketName("test")
                .build();
        
        UploadRequest request = UploadRequest.builder()
                .fileType(FileType.NOTICE)
                .files(List.of(file1, file2))
                .build();
        
        // when
        List<FileUploadResponse> fileUploadResponses = s3FileService.uploadFile(request);
        
        System.out.println(fileUploadResponses);
    
    }
}
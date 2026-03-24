package com.chamapi.file.controller;


import com.chamapi.apiresponse.ApiResponse;
import com.chamapi.file.controller.request.UploadRequest;
import com.chamapi.file.controller.response.PresignedUrlResponse;
import com.chamapi.file.service.S3FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RequestMapping("/api")
@RequiredArgsConstructor
@RestController
public class S3Controller {
    
    private final S3FileService s3FileService;
    
    
    @PostMapping("/presigned-url")
    public List<PresignedUrlResponse> getPresignedUrl(@RequestBody UploadRequest request) {
        return s3FileService.getUploadPresignedUrl(request);
    }
    
    @PostMapping("/upload-file")
    public ApiResponse uploadFile(@RequestBody UploadRequest request) {
        return s3FileService.uploadFile(request);
    }
}

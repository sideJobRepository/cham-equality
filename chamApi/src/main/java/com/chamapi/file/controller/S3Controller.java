package com.chamapi.file.controller;


import com.chamapi.apiresponse.ApiResponse;
import com.chamapi.file.controller.request.UploadRequest;
import com.chamapi.file.controller.response.FileUploadResponse;
import com.chamapi.file.controller.response.PresignedUrlResponse;
import com.chamapi.file.service.S3FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

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
    public ApiResponse<List<FileUploadResponse>> uploadFile(@RequestBody UploadRequest request) {
        List<FileUploadResponse> fileUploadResponses = s3FileService.uploadFile(request);
        return new ApiResponse<>(200,true,fileUploadResponses);
    }
    
    @GetMapping("/download-file/{id}")
    public ApiResponse<String> downloadFile(@PathVariable Long id) {
        String url = s3FileService.fileDownload(id);
        return new ApiResponse<>(200,true,url);
    }
}

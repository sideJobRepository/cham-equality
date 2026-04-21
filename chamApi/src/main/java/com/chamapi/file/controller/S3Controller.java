package com.chamapi.file.controller;


import com.chamapi.common.dto.ApiResponse;
import com.chamapi.file.dto.request.FileUploadRequest;
import com.chamapi.file.dto.request.FileZipDownloadRequest;
import com.chamapi.file.dto.response.FileUploadResponse;
import com.chamapi.file.dto.response.PresignedUrlResponse;
import com.chamapi.file.service.S3FileService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RequestMapping("/api")
@RequiredArgsConstructor
@RestController
public class S3Controller {

    private final S3FileService s3FileService;


    @PostMapping("/presigned-url")
    public List<PresignedUrlResponse> getPresignedUrl(@RequestBody FileUploadRequest request) {
        return s3FileService.getUploadPresignedUrl(request);
    }

    @PostMapping("/upload-file")
    public ApiResponse<List<FileUploadResponse>> uploadFile(@RequestBody FileUploadRequest request) {
        List<FileUploadResponse> fileUploadResponses = s3FileService.uploadFile(request);
        return new ApiResponse<>(200,true,fileUploadResponses);
    }

    @GetMapping("/download-file/{id}")
    public ApiResponse<String> downloadFile(@PathVariable Long id) {
        String url = s3FileService.fileDownload(id);
        return new ApiResponse<>(200,true,url);
    }

    @PostMapping("/download-file/zip")
    public void downloadFilesAsZip(@RequestBody FileZipDownloadRequest request, HttpServletResponse response) throws IOException {
        String zipName = (request.name() == null || request.name().isBlank()) ? "files.zip" : request.name();
        s3FileService.downloadFilesAsZip(request.ids(), zipName, response);
    }
}

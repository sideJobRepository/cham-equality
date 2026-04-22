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

/**
 * S3 파일 업/다운로드 공용 엔드포인트.
 * 업로드는 프론트가 직접 S3로 PUT하는 Presigned URL 방식을 쓰고(3단계: presign → PUT → register),
 * 다운로드는 단건은 Presigned GET URL, 여러 건은 서버 스트리밍 ZIP으로 나뉜다.
 */
@RequestMapping("/api")
@RequiredArgsConstructor
@RestController
public class S3Controller {

    private final S3FileService s3FileService;


    /** [업로드 1단계] 서명 PUT URL 발급. 프론트는 이 URL로 파일을 S3에 직접 올린다. */
    @PostMapping("/presigned-url")
    public List<PresignedUrlResponse> getPresignedUrl(@RequestBody FileUploadRequest request) {
        return s3FileService.getUploadPresignedUrl(request);
    }

    /** [업로드 3단계] PUT 성공 후 메타데이터를 DB에 등록. 이 시점 파일은 TEMPORARY 상태다. */
    @PostMapping("/upload-file")
    public ApiResponse<List<FileUploadResponse>> uploadFile(@RequestBody FileUploadRequest request) {
        List<FileUploadResponse> fileUploadResponses = s3FileService.uploadFile(request);
        return new ApiResponse<>(200,true,fileUploadResponses);
    }

    /**
     * 단건 다운로드용 Presigned GET URL 발급.
     * URL에 {@code Content-Disposition: attachment}를 서명에 박아두기 때문에
     * 브라우저가 어떻게 GET하든 다운로드로 처리된다(프론트가 fetch 없이 {@code <a download>}만 써도 됨).
     */
    @GetMapping("/download-file/{id}")
    public ApiResponse<String> downloadFile(@PathVariable Long id) {
        String url = s3FileService.fileDownload(id);
        return new ApiResponse<>(200,true,url);
    }

    /** 여러 파일 ZIP 다운로드. 서버가 S3에서 스트리밍으로 받아 응답 스트림에 바로 흘린다(메모리 적재 X). */
    @PostMapping("/download-file/zip")
    public void downloadFilesAsZip(@RequestBody FileZipDownloadRequest request, HttpServletResponse response) throws IOException {
        String zipName = (request.name() == null || request.name().isBlank()) ? "files.zip" : request.name();
        s3FileService.downloadFilesAsZip(request.ids(), zipName, response);
    }
}

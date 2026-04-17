package com.chamapi.file.service;

import com.chamapi.common.config.CacheConfig;
import com.chamapi.file.dto.response.FileViewResponse;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.repository.CommonFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class FileViewUrlCache {

    private final S3Presigner s3Presigner;
    private final CommonFileRepository commonFileRepository;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;

    @Cacheable(cacheNames = CacheConfig.FILE_VIEW_URL, key = "#id")
    @Transactional(readOnly = true)
    public FileViewResponse getFileUrl(Long id) {
        CommonFile file = commonFileRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("존재 하지 않는 파일 ID 입니다 : " + id));

        GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                .bucket(bucket)
                .key(file.getFilePath())
                .build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(CacheConfig.FILE_VIEW_URL_TTL)
                .getObjectRequest(getObjectRequest)
                .build();

        PresignedGetObjectRequest presigned = s3Presigner.presignGetObject(presignRequest);

        return new FileViewResponse(
                file.getId(),
                file.getFileName(),
                file.getFileSize(),
                file.getFileContentType(),
                file.getFileType(),
                presigned.url().toString(),
                LocalDateTime.now().plus(CacheConfig.FILE_VIEW_URL_TTL)
        );
    }
}

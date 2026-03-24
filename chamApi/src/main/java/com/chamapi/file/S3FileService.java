package com.chamapi.file;

import com.chamapi.file.request.UploadRequest;
import com.chamapi.file.response.PresignedUrlResponse;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.Date;
import java.util.Map;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Transactional
public class S3FileService {
    
    
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    
    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;
    
    public PresignedUrlResponse getUploadPresignedUrl(UploadRequest request) {
        
        // Object Key 생성 (UUID를 사용하여 고유한 파일명 생성)
        String objectKey = String.format("%s%s%s", UUID.randomUUID(),".", FilenameUtils.getExtension(request.getFileName()));
        
        String contentType = request.getContentType();
        
        //  Presigned URL 생성
        PutObjectRequest objectRequest = PutObjectRequest.builder().bucket(bucket).key(objectKey)
                .contentType(contentType)
                .metadata(Map.of("original-filename", request.getFileName()))
                .build();

        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder().signatureDuration(Duration.ofMinutes(5)).putObjectRequest(objectRequest).build();

        PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

        return new PresignedUrlResponse(presignedRequest.url().toString(), objectKey);
    }
    
}

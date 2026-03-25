package com.chamapi.file.service;

import com.chamapi.file.dto.request.FileUploadRequest;
import com.chamapi.file.dto.response.FileUploadResponse;
import com.chamapi.file.dto.response.PresignedUrlResponse;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.UUID;


@Service
@RequiredArgsConstructor
@Transactional
public class S3FileService {
    
    
    private final S3Client s3Client;
    private final S3Presigner s3Presigner;
    private final CommonFileRepository commonFileRepository;
    
    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;
    
    public List<PresignedUrlResponse> getUploadPresignedUrl(FileUploadRequest request) {
        
        return request.getFiles().stream().map(file -> {
            
            String objectKey = UUID.randomUUID() + "." + FilenameUtils.getExtension(file.getFileName());
            
            PutObjectRequest objectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .contentType(file.getContentType())
                    .metadata(Map.of("original-filename", file.getFileName()))
                    .build();
            
            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(5))
                    .putObjectRequest(objectRequest)
                    .build();
            
            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);
            
            return new PresignedUrlResponse(
                    presignedRequest.url().toString(),
                    objectKey,
                    file.getFileName(),
                    bucket,
                    file.getContentType()
            );
        }).toList();
    }
    
    public List<FileUploadResponse> uploadFile(FileUploadRequest request) {
        FileType fileType = request.getFileType();
        return request.getFiles()
                .stream()
                .map(file -> {
                    CommonFile save = CommonFile
                            .builder()
                            .fileName(file.getFileName())
                            .fileSize(file.getFileSize())
                            .fileContentType(file.getContentType())
                            .filePath(file.getObjectKey())
                            .fileType(fileType)
                            .bucketName(file.getBucketName())
                            .fileStatus(FileStatus.TEMPORARY)
                            .build();
                    commonFileRepository.save(save);
                    return FileUploadResponse.from(save);
                }).toList();
    }
    
    @Transactional(readOnly = true)
    public String fileDownload(Long id) {
        CommonFile file = commonFileRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("존재 하지 않는 파일 ID 입니다 : " + id));
        
        GetObjectRequest getObjectRequest = GetObjectRequest.builder().bucket(bucket)
                .key(file.getFilePath())
                .responseContentDisposition("attachment; filename=\"" + file.getFileName() + "\"").build();
        
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder().signatureDuration(Duration.ofMinutes(5)).getObjectRequest(getObjectRequest).build();
        
        PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner.presignGetObject(presignRequest);
        
        return presignedGetObjectRequest.url().toString();
    }
}

package com.chamapi.file.dto.response;

import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.enums.FileType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@AllArgsConstructor
@Builder
public class FileUploadResponse {
    
    private Long fileId;
    private String fileName;
    private Integer fileSize;
    private String contentType;
    private String objectKey;
    private String bucketName;
    private FileType fileType;
    private FileStatus fileStatus;
    
    public static FileUploadResponse from(CommonFile file) {
        return FileUploadResponse.builder()
                .fileId(file.getId())
                .fileName(file.getFileName())
                .fileSize(file.getFileSize())
                .contentType(file.getFileContentType())
                .objectKey(file.getFilePath())
                .bucketName(file.getBucketName())
                .fileType(file.getFileType())
                .fileStatus(file.getFileStatus())
                .build();
    }
}

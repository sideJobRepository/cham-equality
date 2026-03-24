package com.chamapi.file.controller.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class FileUploadInfo {
    private String fileName;
    private String objectKey;
    private String contentType;
    private String bucketName;
    private Integer fileSize;
}

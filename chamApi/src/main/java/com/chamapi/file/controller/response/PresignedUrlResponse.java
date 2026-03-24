package com.chamapi.file.controller.response;


import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresignedUrlResponse {
    private String url;
    private String objectKey;
    private Long fileId;
    private String bucketName;
    private String contentType;
    private String fileName;
    
    public PresignedUrlResponse(String url, String objectKey,String fileName,String bucketName,String contentType) {
        this.url = url;
        this.objectKey = objectKey;
        this.fileName = fileName;
        this.bucketName = bucketName;
        this.contentType = contentType;
    }
}

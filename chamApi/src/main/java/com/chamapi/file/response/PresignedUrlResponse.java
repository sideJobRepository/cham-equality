package com.chamapi.file.response;


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
    
    public PresignedUrlResponse(String url, String objectKey) {
        this.url = url;
        this.objectKey = objectKey;
    }
}

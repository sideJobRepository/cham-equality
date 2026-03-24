package com.chamapi.file.request;

import lombok.Data;

import java.util.List;

@Data
public class UploadRequest {
    private String key;
     private String bucket;
     private String fileName;
     private Long fileSize;
     private String entityType;
     private String entityId;
     private String contentType;
     private List<Long> keys;
}

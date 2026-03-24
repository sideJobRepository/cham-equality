package com.chamapi.file.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
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

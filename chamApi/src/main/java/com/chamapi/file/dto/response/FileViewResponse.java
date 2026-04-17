package com.chamapi.file.dto.response;

import com.chamapi.file.enums.FileType;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@AllArgsConstructor
@Getter
public class FileViewResponse{
    
    private Long fileId;
    private String fileName;
    private Integer fileSize;
    private String contentType;
    private FileType fileType;
    private String url;
    private LocalDateTime expiresAt;
    
}

package com.chamapi.file.dto.request;

import com.chamapi.file.enums.FileType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class FileUploadRequest {

    private FileType fileType;
    private List<FileUploadInfo> files;

    public List<FileUploadInfo> getFiles() {
        if (this.files == null) {
            this.files = new ArrayList<>();
        }
        return this.files;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class FileUploadInfo {
        private String fileName;
        private String objectKey;
        private String contentType;
        private String bucketName;
        private Integer fileSize;
    }
}

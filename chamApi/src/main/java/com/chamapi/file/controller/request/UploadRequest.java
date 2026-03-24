package com.chamapi.file.controller.request;

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
public class UploadRequest {
    private FileType fileType;
    private List<FileUploadInfo> files;
    
    public List<FileUploadInfo> getFiles() {
        if(this.files == null){
            this.files = new ArrayList<>();
        }
        return this.files;
    }
}

package com.chamapi.file.dto.request;

import com.chamapi.file.enums.FileProcessStatus;
import com.chamapi.file.enums.FileType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * 파일 변경 요청 DTO
 *
 * 게시글, 엔티티 등에서 파일 수정 시 사용되며,
 * 각 파일에 대한 처리 상태를 포함한다.
 *
 * fileProcessStatus 값에 따라 서버에서 다음과 같이 처리된다.
 * - CREATE: 신규 파일 생성 (target Id , status update)
 * - DELETE: 기존 파일 삭제 (DB delete , s3 delete)
 * - NORMAL: 기존 파일 유지 (처리 없음)
 *
 * id가 존재하는 경우 기존 파일로 간주하며,
 * CREATE 상태일 경우 신규 업로드된 파일로 처리한다.
 */
public class FileRequest {
    
    private FileType fileType;
    private List<FileChangeRequest> files;
    
    public List<FileChangeRequest> getFiles() {
        if (this.files == null) {
            this.files = new ArrayList<>();
        }
        return this.files;
    }
    
    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class FileChangeRequest {
        private Long id;
        private String fileName;
        private String objectKey;
        private String contentType;
        private String bucketName;
        private Integer fileSize;
        private FileProcessStatus fileProcessStatus;
    }
}

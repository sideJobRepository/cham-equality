package com.chamapi.file.entity;


import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.enums.FileType;
import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

@Table(name = "COMMON_FILE")
@Getter
@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CommonFile extends DateSuperClass {
    
    // 공통 파일 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "FILE_ID")
    private Long id;
    
    // 공통 파일 타겟 ID
    @Column(name = "FILE_TARGET_ID")
    private Long targetId;
    
    // 공통 파일 이름
    @Column(name = "FILE_NAME")
    private String fileName;
    
    // 공통 파일 크기
    @Column(name = "FILE_SIZE")
    private Integer fileSize;
    
    // 공통 파일 콘텐트 타입
    @Column(name = "FILE_CONTENT_TYPE")
    private String fileContentType;
    
    // 공통 파일 경로 (오브젝트 키로 넣으면될듯)
    @Column(name = "FILE_PATH")
    private String filePath;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "FILE_TYPE")
    private FileType fileType;
    
    // 공통 파일 버킷 이름
    @Column(name = "FILE_BUCKET_NAME")
    private String bucketName;
    
    // 공통 파일 상태
    @Enumerated(EnumType.STRING)
    @Column(name = "FILE_STATUS")
    private FileStatus fileStatus;
    
    public void createTargetIdAndModifyCompleteFileStatus(Long targetId){
        this.targetId = targetId;
        this.fileStatus = FileStatus.COMPLETE;
    }
    
    public void modifyTemporaryFileStatus(){
        this.fileStatus = FileStatus.TEMPORARY;
    }
}

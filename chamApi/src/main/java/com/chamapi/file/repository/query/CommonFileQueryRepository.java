package com.chamapi.file.repository.query;

import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileType;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

public interface CommonFileQueryRepository {

    List<CommonFile> findTemporaryFilesBefore(LocalDateTime targetDateTime);

    List<CommonFile> findFilesIds(List<Long> ids);

    List<CommonFile> findByTargetIdAndFileType(Long targetId, FileType fileType);
    
    List<CommonFile> findByPathsAndFileType(Set<String> currentKeys, FileType type);
}

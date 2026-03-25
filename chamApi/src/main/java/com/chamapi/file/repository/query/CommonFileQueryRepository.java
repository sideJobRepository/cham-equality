package com.chamapi.file.repository.query;

import com.chamapi.file.entity.CommonFile;

import java.time.LocalDateTime;
import java.util.List;

public interface CommonFileQueryRepository {

    List<CommonFile> findTemporaryFilesBefore(LocalDateTime targetDateTime);
    
    List<CommonFile> findFilesIds(List<Long> ids);
}

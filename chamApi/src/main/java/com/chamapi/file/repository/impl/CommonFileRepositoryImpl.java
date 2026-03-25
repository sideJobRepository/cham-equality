package com.chamapi.file.repository.impl;

import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.repository.query.CommonFileQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

import static com.chamapi.file.entity.QCommonFile.commonFile;

@RequiredArgsConstructor
public class CommonFileRepositoryImpl implements CommonFileQueryRepository {
    
    private final JPAQueryFactory queryFactory;
    
    @Override
    public List<CommonFile> findTemporaryFilesBefore(LocalDateTime targetDateTime) {
        return queryFactory
                .selectFrom(commonFile)
                .where(
                        commonFile.fileStatus.eq(FileStatus.TEMPORARY),
                        commonFile.createDate.lt(targetDateTime)
                )
                .fetch();
    }
}

package com.chamapi.file.service;

import java.util.Collection;
import java.util.Map;

/**
 * 다운로드 시 파일명을 도메인 규칙으로 재작성하기 위한 후크.
 * 각 도메인 모듈이 이 인터페이스의 빈을 등록하면 {@link S3FileService}가 모두 합쳐
 * fileId → 사용자에게 노출할 파일명 매핑을 만든다. 매핑이 없는 파일은 원본 이름 그대로 내려간다.
 */
public interface FileNameResolver {

    /**
     * 주어진 fileId 중에서 이 도메인이 책임지는 파일에 한해 override 이름을 반환한다.
     * 책임지지 않는 fileId는 결과에 포함시키지 않는다.
     */
    Map<Long, String> resolveOverrideNames(Collection<Long> fileIds);
}

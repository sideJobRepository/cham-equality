package com.chamapi.file.service;


import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * CK Editor 등으로 본문 HTML 안에 박힌 인라인 이미지의 라이프사이클을 추적하는 범용 컴포넌트.
 *
 * 사용 패턴:
 *  - 도메인 (공지/자유게시판/리뷰 등) 저장 시 {@link #syncInlineFiles(String, FileType, Long)} 한 번 호출
 *  - 도메인 삭제 시 {@link #releaseInlineFiles(FileType, Long)} 호출
 *
 * 동작:
 *  - HTML 안의 모든 {@code <img src="...">} URL → path 부분(objectKey)을 추출
 *  - 추출된 objectKey 들로 BgmAgitFile 매칭 → COMPLETE + targetId 로 승격
 *  - 기존 동일 (targetId, fileType) COMPLETE 행 중 본문에 없는 것 → TEMPORARY 로 되돌림
 *
 * 결과:
 *  - 본문에 박힌 이미지는 COMPLETE 로 도메인에 묶임
 *  - 사용자가 글 수정하면서 뺀 이미지는 TEMPORARY → 일일 배치가 청소
 *  - 글 삭제 시 모든 인라인 이미지도 함께 청소
 *
 * 다른 프로젝트로 옮길 때:
 *  - {@link FileType} 와 {@link BgmAgitFile} 만 그 프로젝트의 enum/엔티티로 교체하면 그대로 동작
 *  - HTML 정규식과 URL → objectKey 변환은 프로젝트 무관
 */
@Service
@Transactional
@RequiredArgsConstructor
public class InlineFileTracker {

    private final CommonFileRepository commonFileRepository;

    private static final Pattern IMG_SRC = Pattern.compile(
            "<img[^>]+src=[\"']([^\"']+)[\"']",
            Pattern.CASE_INSENSITIVE
    );

    /**
     * 도메인 CREATE/UPDATE 시 호출. 본문 HTML 과 동기화한다.
     *
     * @param htmlContent 도메인의 본문 HTML
     * @param type         이 도메인의 인라인 파일 타입 (예: MAHJONG_NOTICE_INLINE)
     * @param targetId     도메인 행 ID
     */
    public void syncInlineFiles(String htmlContent, FileType type, Long targetId) {
        Set<String> currentKeys = extractObjectKeys(htmlContent);

        // 1) 본문에 있는 이미지 → COMPLETE + targetId 승격
        if (!currentKeys.isEmpty()) {
            List<CommonFile> matched = commonFileRepository.findByPathsAndFileType(currentKeys, type);
            for (CommonFile file : matched) {
                file.createTargetIdAndModifyCompleteFileStatus(targetId);
            }
        }

        // 2) 기존 targetId 에 묶여있던 인라인 중 본문에 없는 것 → TEMPORARY (배치 청소 대상)
        List<CommonFile> existing = commonFileRepository.findByTargetIdAndFileType(targetId, type);
        for (CommonFile file : existing) {
            if (!currentKeys.contains(file.getFilePath())) {
                file.modifyTemporaryFileStatus();
            }
        }
    }

    /**
     * 도메인 DELETE 시 호출. 해당 도메인에 묶여있던 인라인 파일을 모두 TEMPORARY 로 되돌림.
     */
    public void releaseInlineFiles(FileType type, Long targetId) {
        List<CommonFile> existing = commonFileRepository.findByTargetIdAndFileType(targetId, type);
        existing.forEach(CommonFile::modifyTemporaryFileStatus);
    }

    /**
     * HTML 에서 {@code <img src>} URL 들을 추출해 objectKey(URL path 부분) Set 으로 반환.
     * presigned URL 의 query string 은 자동 제거됨 (URI.getPath() 가 path 만 돌려주므로).
     */
    private Set<String> extractObjectKeys(String html) {
        if (html == null || html.isBlank()) return Set.of();
        Set<String> keys = new HashSet<>();
        Matcher m = IMG_SRC.matcher(html);
        while (m.find()) {
            String src = m.group(1);
            String key = toObjectKey(src);
            if (key != null && !key.isBlank()) keys.add(key);
        }
        return keys;
    }

    /**
     * URL → objectKey. host 는 무시하고 path 부분만 사용 (앞 슬래시 제거).
     * 상대 경로/외부 URL/잘못된 URL 은 null.
     */
    private String toObjectKey(String src) {
        try {
            URI uri = new URI(src);
            String path = uri.getPath();
            if (path == null) return null;
            return path.startsWith("/") ? path.substring(1) : path;
        } catch (URISyntaxException e) {
            return null;
        }
    }
}

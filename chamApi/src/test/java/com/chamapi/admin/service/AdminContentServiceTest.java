package com.chamapi.admin.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.admin.dto.request.AdminContentCreateRequest;
import com.chamapi.admin.dto.request.AdminContentUpdateRequest;
import com.chamapi.content.entity.Content;
import com.chamapi.content.enums.ContentType;
import com.chamapi.content.repository.ContentRepository;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Constructor;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class AdminContentServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private AdminContentService adminContentService;

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private CommonFileRepository commonFileRepository;

    @Autowired
    private EntityManager em;

    @BeforeEach
    void cleanUp() {
        contentRepository.deleteAllInBatch();
        commonFileRepository.deleteAllInBatch();
    }

    @DisplayName("getAllContents - 저장된 모든 Content 를 반환한다")
    @Test
    void test1() {
        Content a = save("a", ContentType.IN_APP_POPUP);
        Content b = save("b", ContentType.ORGANIZATION_ACTIVITY);
        Content c = save("c", ContentType.CITIZEN_PARTICIPATION);

        List<Content> results = adminContentService.getAllContents();

        assertThat(results).extracting(Content::getId)
                .containsExactlyInAnyOrder(a.getId(), b.getId(), c.getId());
    }

    @DisplayName("createContent - 요청 값으로 새 Content 가 저장되고 모든 필드가 그대로 매핑되며, 첨부된 파일이 COMPLETE 로 전환되고 targetId 가 세팅된다")
    @Test
    void test2() {
        CommonFile imageFile = saveTemporaryFile();

        LocalDateTime start = LocalDateTime.of(2026, 6, 14, 12, 0);
        LocalDateTime end = start.plusDays(7);
        AdminContentCreateRequest request = new AdminContentCreateRequest(
                ContentType.IN_APP_POPUP,
                "신규 컨텐츠",
                imageFile.getId(),
                "https://example.com",
                "추가 정보",
                start,
                end
        );

        adminContentService.createContent(request);

        em.flush();
        em.clear();
        List<Content> all = contentRepository.findAll();
        assertThat(all).hasSize(1);
        Content saved = all.get(0);
        assertThat(saved.getId()).isNotNull();
        assertThat(saved).extracting(
                Content::getContentType,
                Content::getName,
                Content::getImageFileId,
                Content::getUrl,
                Content::getAdditionalInfo,
                Content::getDisplayStartDate,
                Content::getDisplayEndDate
        ).containsExactly(
                ContentType.IN_APP_POPUP,
                "신규 컨텐츠",
                imageFile.getId(),
                "https://example.com",
                "추가 정보",
                start,
                end
        );

        CommonFile updatedFile = commonFileRepository.findById(imageFile.getId()).orElseThrow();
        assertThat(updatedFile.getFileStatus()).isEqualTo(FileStatus.COMPLETE);
        assertThat(updatedFile.getTargetId()).isEqualTo(saved.getId());
    }

    @DisplayName("updateContent - 존재하는 id 는 필드가 업데이트되고, 새로 첨부된 파일은 COMPLETE 로 전환되고 targetId 가 세팅된다")
    @Test
    void test3() {
        Content content = save("원래 이름", ContentType.IN_APP_POPUP);
        ReflectionTestUtils.setField(content, "imageFileId", 1L);
        ReflectionTestUtils.setField(content, "url", "https://old.example.com");
        ReflectionTestUtils.setField(content, "additionalInfo", "원래 정보");
        ReflectionTestUtils.setField(content, "displayStartDate", LocalDateTime.of(2026, 1, 1, 0, 0));
        ReflectionTestUtils.setField(content, "displayEndDate", LocalDateTime.of(2026, 1, 31, 0, 0));
        contentRepository.saveAndFlush(content);
        em.clear();

        CommonFile newImageFile = saveTemporaryFile();

        LocalDateTime newStart = LocalDateTime.of(2026, 6, 14, 12, 0);
        LocalDateTime newEnd = newStart.plusDays(7);
        AdminContentUpdateRequest request = new AdminContentUpdateRequest(
                "변경된 이름",
                newImageFile.getId(),
                "https://new.example.com",
                "변경된 정보",
                newStart,
                newEnd
        );

        adminContentService.updateContent(content.getId(), request);

        em.flush();
        em.clear();
        Content updated = contentRepository.findById(content.getId()).orElseThrow();
        assertThat(updated).extracting(
                Content::getName,
                Content::getImageFileId,
                Content::getUrl,
                Content::getAdditionalInfo,
                Content::getDisplayStartDate,
                Content::getDisplayEndDate
        ).containsExactly(
                "변경된 이름",
                newImageFile.getId(),
                "https://new.example.com",
                "변경된 정보",
                newStart,
                newEnd
        );

        CommonFile updatedFile = commonFileRepository.findById(newImageFile.getId()).orElseThrow();
        assertThat(updatedFile.getFileStatus()).isEqualTo(FileStatus.COMPLETE);
        assertThat(updatedFile.getTargetId()).isEqualTo(content.getId());
    }

    @DisplayName("updateContent - 존재하지 않는 id 는 IllegalArgumentException 이 발생한다")
    @Test
    void test4(){
        LocalDateTime newStart = LocalDateTime.of(2026, 6, 14, 12, 0);
        LocalDateTime newEnd = newStart.plusDays(7);
        AdminContentUpdateRequest request = new AdminContentUpdateRequest(
                "변경된 이름",
                200L,
                "https://new.example.com",
                "변경된 정보",
                newStart,
                newEnd
        );

        long missingId = 9999L;
        assertThatThrownBy(() -> adminContentService.updateContent(missingId, request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Content를 찾을 수 없습니다. id = " + missingId);
    }

    @DisplayName("removeContent - 존재하는 id 의 Content 가 DB 에서 삭제된다")
    @Test
    void test5() {
        Content content = save("삭제 대상", ContentType.IN_APP_POPUP);
        Long id = content.getId();
        em.clear();

        adminContentService.removeContent(id);

        em.flush();
        em.clear();
        assertThat(contentRepository.findById(id)).isEmpty();
    }


    private Content save(String name, ContentType contentType) {
        Content content = newContent();
        ReflectionTestUtils.setField(content, "contentType", contentType);
        ReflectionTestUtils.setField(content, "name", name);
        return contentRepository.saveAndFlush(content);
    }

    private CommonFile saveTemporaryFile() {
        CommonFile file = CommonFile.builder()
                .fileName("image.jpg")
                .fileSize(123)
                .fileContentType("image/jpeg")
                .filePath("temp-object-key.jpg")
                .fileType(FileType.CONTENT_IMAGE)
                .bucketName("test-bucket")
                .fileStatus(FileStatus.TEMPORARY)
                .build();
        return commonFileRepository.saveAndFlush(file);
    }

    private Content newContent() {
        try {
            Constructor<Content> constructor = Content.class.getDeclaredConstructor();
            constructor.setAccessible(true);
            return constructor.newInstance();
        } catch (ReflectiveOperationException e) {
            throw new IllegalStateException(e);
        }
    }
}

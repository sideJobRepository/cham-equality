package com.chamapi.content.repository;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.content.entity.Content;
import com.chamapi.content.enums.ContentType;
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

@Transactional
class ContentRepositoryTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private ContentRepository contentRepository;

    @Autowired
    private EntityManager em;

    @BeforeEach
    void cleanUp() {
        contentRepository.deleteAllInBatch();
    }

    @DisplayName("findDisplayableAt - displayStartDate <= date <= displayEndDate 인 컨텐츠는 경계 포함 모두 반환된다")
    @Test
    void test1() {
        LocalDateTime date = LocalDateTime.of(2026, 6, 14, 12, 0);
        Content startBoundary = save("start", date, date.plusDays(1));
        Content endBoundary = save("end", date.minusDays(1), date);
        Content inside = save("inside", date.minusDays(1), date.plusDays(1));

        List<Content> results = contentRepository.findDisplayableAt(date);

        assertThat(results).extracting(Content::getId)
                .containsExactlyInAnyOrder(startBoundary.getId(), endBoundary.getId(), inside.getId());
    }

    @DisplayName("findDisplayableAt - date 가 displayStartDate 이전이거나 displayEndDate 이후이면 제외된다")
    @Test
    void test2() {
        LocalDateTime date = LocalDateTime.of(2026, 6, 14, 12, 0);
        save("future", date.plusDays(1), date.plusDays(2));
        save("past", date.minusDays(2), date.minusDays(1));

        List<Content> results = contentRepository.findDisplayableAt(date);

        assertThat(results).isEmpty();
    }

    @DisplayName("findDisplayableAt - displayStartDate 또는 displayEndDate 가 NULL 이면 제외된다")
    @Test
    void test3() {
        LocalDateTime date = LocalDateTime.of(2026, 6, 14, 12, 0);
        save("start-null", null, date.plusDays(1));
        save("end-null", date.minusDays(1), null);

        List<Content> results = contentRepository.findDisplayableAt(date);

        assertThat(results).isEmpty();
    }

    private Content save(String name, LocalDateTime start, LocalDateTime end) {
        Content content = newContent();
        ReflectionTestUtils.setField(content, "contentType", ContentType.IN_APP_POPUP);
        ReflectionTestUtils.setField(content, "name", name);
        ReflectionTestUtils.setField(content, "displayStartDate", start);
        ReflectionTestUtils.setField(content, "displayEndDate", end);
        return contentRepository.saveAndFlush(content);
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

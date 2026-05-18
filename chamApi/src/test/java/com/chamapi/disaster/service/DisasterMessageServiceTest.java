package com.chamapi.disaster.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.disaster.dto.response.ActiveDisasterResponse;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;
import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;
import com.chamapi.disaster.repository.DisasterMessageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class DisasterMessageServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private DisasterMessageService queryService;

    @Autowired
    private DisasterMessageRepository repository;

    @DisplayName("최근 6시간 내 대전 위급재난이 있으면 active=true")
    @Test
    void test1() {
        save("대전광역시 동구", EmergencyStep.CRITICAL, LocalDateTime.now().minusHours(1));

        ActiveDisasterResponse response = queryService.findActive();

        assertThat(response.active()).isTrue();
        assertThat(response.message().regionName()).startsWith("대전");
    }



    @DisplayName("위급재난이 6시간 윈도우를 벗어나면 active=false")
    @Test
    void test2() {
        save("대전광역시 중구", EmergencyStep.CRITICAL, LocalDateTime.now().minusHours(7));

        ActiveDisasterResponse response = queryService.findActive();

        assertThat(response.active()).isFalse();
    }

    @DisplayName("findOne — 존재하는 id 정상 매핑")
    @Test
    void test3() {
        DisasterMessage saved = save("대전광역시 유성구", EmergencyStep.EMERGENCY, LocalDateTime.now());

        DisasterMessageResponse response = queryService.findOne(saved.getId());

        assertThat(response.id()).isEqualTo(saved.getId());
        assertThat(response.emergencyStep()).isEqualTo(EmergencyStep.EMERGENCY);
    }

    @DisplayName("findOne — 없는 id 면 BadRequestException")
    @Test
    void test4() {
        assertThatThrownBy(() -> queryService.findOne(Long.MAX_VALUE))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("재난문자를 찾을 수 없습니다");
    }

    private DisasterMessage save(String regionName, EmergencyStep step, LocalDateTime issuedAt) {
        DisasterMessage entity = DisasterMessage.builder()
                .sn(9_999_999_000L + System.nanoTime() % 1000)
                .content("테스트 재난문자 본문")
                .regionName(regionName)
                .emergencyStep(step)
                .category("기타")
                .issuedAt(issuedAt)
                .build();
        return repository.saveAndFlush(entity);
    }
}

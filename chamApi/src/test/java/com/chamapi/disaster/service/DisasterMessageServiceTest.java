package com.chamapi.disaster.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.disaster.dto.response.DisasterMessageResponse;
import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;
import com.chamapi.disaster.repository.DisasterMessageRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class DisasterMessageServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private DisasterMessageService queryService;

    @Autowired
    private DisasterMessageRepository repository;

    @DisplayName("대전 재난문자를 발령시각 내림차순 최신 5건 반환 (단계 무관)")
    @Test
    void test1() {
  
        List<DisasterMessageResponse> result = queryService.findLatest("ja");
        
        System.out.println(result);
  
    }

    @DisplayName("대전이 아닌 지역 재난문자는 최신이라도 제외")
    @Test
    void test2() {
        LocalDateTime base = LocalDateTime.now().plusYears(1);
        DisasterMessage seoul = save("서울특별시 중구", EmergencyStep.CRITICAL, base.plusMinutes(10)); // 가장 최신이지만 서울
        DisasterMessage daejeon = save("대전광역시 서구", EmergencyStep.ETC, base);

        List<DisasterMessageResponse> result = queryService.findLatest("ko");

        // 지역 필터 유지: 결과는 모두 대전 포함, 서울 전용 픽스처는 최신이라도 제외
        assertThat(result).extracting(DisasterMessageResponse::regionName)
                .allMatch(r -> r.contains("대전"));
        assertThat(result).extracting(DisasterMessageResponse::sn)
                .contains(daejeon.getSn())
                .doesNotContain(seoul.getSn());
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

    private long snSeq = 9_100_000_000L;

    private DisasterMessage save(String regionName, EmergencyStep step, LocalDateTime issuedAt) {
        DisasterMessage entity = DisasterMessage.builder()
                .sn(++snSeq)
                .content("테스트 재난문자 본문")
                .regionName(regionName)
                .emergencyStep(step)
                .category("기타")
                .issuedAt(issuedAt)
                .build();
        return repository.saveAndFlush(entity);
    }
}

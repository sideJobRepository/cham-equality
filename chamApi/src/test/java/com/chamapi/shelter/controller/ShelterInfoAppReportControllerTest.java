package com.chamapi.shelter.controller;

import com.chamapi.ControllerTestSupport;
import com.chamapi.member.entity.Member;
import com.chamapi.member.enums.SocialType;
import com.chamapi.member.repository.MemberRepository;
import com.chamapi.shelter.dto.request.ShelterInfoAppReportCreateRequest;
import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.entity.Region;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import com.chamapi.shelter.repository.ShelterInfoAppReportRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@ActiveProfiles("test")
class ShelterInfoAppReportControllerTest extends ControllerTestSupport {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private ShelterRepository shelterRepository;

    @Autowired
    private ShelterInfoAppReportRepository appReportRepository;

    @Autowired
    private EntityManager em;

    @DisplayName("로그인 상태로 제보하면 200이고 제보가 회원ID로 저장된다")
    @Test
    void test1() throws Exception {
        Member member = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);
        String body = jsonMapper.writeValueAsString(new ShelterInfoAppReportCreateRequest(
                shelter.getId(), "한국어", true, false, true, false, "음성안내", null));

        mockMvc.perform(post("/api/app/shelter-reports")
                        .with(jwt().jwt(j -> j.claim("id", member.getId())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        boolean saved = appReportRepository.findAll().stream()
                .anyMatch(r -> member.getId().equals(r.getMemberId())
                        && shelter.getId().equals(r.getShelterId()));
        assertThat(saved).isTrue();
    }

    @DisplayName("토큰 없이 제보하면 401")
    @Test
    void test2() throws Exception {
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);
        String body = jsonMapper.writeValueAsString(new ShelterInfoAppReportCreateRequest(
                shelter.getId(), null, true, null, null, null, null, null));

        mockMvc.perform(post("/api/app/shelter-reports")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @DisplayName("내 제보 목록에 방금 올린 제보가 대기상태로 보인다")
    @Test
    void test3() throws Exception {
        Member member = persistMember();
        Shelter shelter = persistShelter(ShelterSurveyStatus.NOT_INVESTIGATED);
        String body = jsonMapper.writeValueAsString(new ShelterInfoAppReportCreateRequest(
                shelter.getId(), "KO", true, null, null, null, null, null));

        mockMvc.perform(post("/api/app/shelter-reports")
                        .with(jwt().jwt(j -> j.claim("id", member.getId())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/app/shelter-reports")
                        .with(jwt().jwt(j -> j.claim("id", member.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].shelterName").value("테스트대피소"))
                .andExpect(jsonPath("$.data[0].requestStatus").value("PENDING"));
    }

    private Member persistMember() {
        return memberRepository.save(Member.builder()
                .memberName("테스트유저")
                .email("t" + System.nanoTime() + "@test.com")
                .socialType(SocialType.KAKAO)
                .socialId("test-" + System.nanoTime())
                .build());
    }

    private Shelter persistShelter(ShelterSurveyStatus status) {
        Region region = new Region(null, "대전광역시", "광역시", 1, null, null);
        em.persist(region);
        Place place = Place.builder()
                .region(region)
                .name("테스트장소")
                .address("대전광역시 중구")
                .build();
        em.persist(place);
        return shelterRepository.save(Shelter.builder()
                .place(place)
                .name("테스트대피소")
                .surveyStatus(status)
                .build());
    }
}

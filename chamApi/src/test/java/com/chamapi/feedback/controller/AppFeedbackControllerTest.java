package com.chamapi.feedback.controller;

import com.chamapi.ControllerTestSupport;
import com.chamapi.feedback.dto.request.AppFeedbackCreateRequest;
import com.chamapi.feedback.dto.request.AppFeedbackUpdateRequest;
import com.chamapi.feedback.enums.AppFeedbackCategory;
import com.chamapi.feedback.repository.AppFeedbackRepository;
import com.chamapi.member.entity.Member;
import com.chamapi.member.enums.SocialType;
import com.chamapi.member.repository.MemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Transactional
@ActiveProfiles("test")
class AppFeedbackControllerTest extends ControllerTestSupport {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private AppFeedbackRepository appFeedbackRepository;

    @DisplayName("접수는 토큰 없이도 200이다")
    @Test
    void test1() throws Exception {
        mockMvc.perform(post("/api/app/feedbacks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("비로그인 피드백")))
                .andExpect(status().isOk());
    }

    @DisplayName("토큰 없이 내 피드백을 조회·수정·삭제하면 401")
    @Test
    void test2() throws Exception {
        mockMvc.perform(get("/api/app/feedbacks"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/app/feedbacks/1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/app/feedbacks/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonMapper.writeValueAsString(new AppFeedbackUpdateRequest(
                                AppFeedbackCategory.ETC, "고친 내용", null, null))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(delete("/api/app/feedbacks/1"))
                .andExpect(status().isUnauthorized());
    }

    @DisplayName("로그인 상태면 접수한 피드백을 목록·상세로 다시 보고 지울 수 있다")
    @Test
    void test3() throws Exception {
        Member member = persistMember();

        mockMvc.perform(post("/api/app/feedbacks")
                        .with(jwt().jwt(j -> j.claim("id", member.getId())))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody("로그인 피드백")))
                .andExpect(status().isOk());

        Long feedbackId = appFeedbackRepository.findAllByMemberIdOrderByCreateDateDesc(member.getId())
                .getFirst()
                .getId();

        mockMvc.perform(get("/api/app/feedbacks")
                        .with(jwt().jwt(j -> j.claim("id", member.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].content").value("로그인 피드백"));

        mockMvc.perform(get("/api/app/feedbacks/" + feedbackId)
                        .with(jwt().jwt(j -> j.claim("id", member.getId()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.adminNote").doesNotExist());

        mockMvc.perform(delete("/api/app/feedbacks/" + feedbackId)
                        .with(jwt().jwt(j -> j.claim("id", member.getId()))))
                .andExpect(status().isOk());

        assertThat(appFeedbackRepository.findById(feedbackId)).isEmpty();
    }

    private String createBody(String content) {
        return jsonMapper.writeValueAsString(new AppFeedbackCreateRequest(
                AppFeedbackCategory.BUG, content, null, "1.0", "ANDROID", "14", "SM-S906N", "MapScreen", null));
    }

    private Member persistMember() {
        return memberRepository.save(Member.builder()
                .memberName("테스트유저")
                .email("fc" + System.nanoTime() + "@test.com")
                .socialType(SocialType.KAKAO)
                .socialId("feedback-ctrl-" + System.nanoTime())
                .build());
    }
}

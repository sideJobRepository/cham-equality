package com.chamapi.feedback.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.feedback.dto.request.AppFeedbackAdminUpdateRequest;
import com.chamapi.feedback.dto.request.AppFeedbackCreateRequest;
import com.chamapi.feedback.dto.response.AppFeedbackDetailResponse;
import com.chamapi.feedback.dto.response.AppFeedbackListResponse;
import com.chamapi.feedback.entity.AppFeedback;
import com.chamapi.feedback.enums.AppFeedbackCategory;
import com.chamapi.feedback.enums.AppFeedbackStatus;
import com.chamapi.feedback.repository.AppFeedbackRepository;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import com.chamapi.member.entity.Member;
import com.chamapi.member.enums.SocialType;
import com.chamapi.member.repository.MemberRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class AppFeedbackServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private AppFeedbackService appFeedbackService;

    @Autowired
    private AppFeedbackRepository appFeedbackRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private CommonFileRepository commonFileRepository;

    @DisplayName("비로그인 피드백은 작성자 없이 접수 상태로 저장된다")
    @Test
    void test1() {
        Long feedbackId = appFeedbackService.create(
                createRequest(AppFeedbackCategory.BUG, "지도가 빈 화면으로 뜹니다", null), null);

        AppFeedback saved = appFeedbackRepository.findById(feedbackId).orElseThrow();
        assertThat(saved.getMemberId()).isNull();
        assertThat(saved.getStatus()).isEqualTo(AppFeedbackStatus.RECEIVED);
        assertThat(saved.getCategory()).isEqualTo(AppFeedbackCategory.BUG);
        assertThat(saved.getContent()).isEqualTo("지도가 빈 화면으로 뜹니다");
        assertThat(saved.getPlatform()).isEqualTo("ANDROID");
        assertThat(saved.getAppVersion()).isEqualTo("1.0");
    }

    @DisplayName("로그인 상태로 보내면 작성자 회원ID가 연결된다")
    @Test
    void test2() {
        Member member = persistMember();

        Long feedbackId = appFeedbackService.create(
                createRequest(AppFeedbackCategory.IMPROVEMENT, "글자 크기를 키워주세요", null), member.getId());

        assertThat(appFeedbackRepository.findById(feedbackId).orElseThrow().getMemberId())
                .isEqualTo(member.getId());
    }

    @DisplayName("내용이 비었거나 2000자를 넘거나 사진이 5장을 넘으면 접수가 막힌다")
    @Test
    void test3() {
        assertThatThrownBy(() -> appFeedbackService.create(
                createRequest(AppFeedbackCategory.ETC, "   ", null), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("내용을 입력");

        assertThatThrownBy(() -> appFeedbackService.create(
                createRequest(AppFeedbackCategory.ETC, "가".repeat(2001), null), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("2000자");

        assertThatThrownBy(() -> appFeedbackService.create(
                createRequest(AppFeedbackCategory.ETC, "사진 많음", List.of(1L, 2L, 3L, 4L, 5L, 6L)), null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("최대 5장");
    }

    @DisplayName("첨부한 스크린샷은 피드백 ID로 연결되고 상세에서 조회된다")
    @Test
    void test4() {
        Member member = persistMember();
        CommonFile file = commonFileRepository.save(CommonFile.builder()
                .fileName("shot.png")
                .filePath("feedback/shot.png")
                .fileType(FileType.FEEDBACK_IMAGE)
                .fileStatus(FileStatus.TEMPORARY)
                .build());

        Long feedbackId = appFeedbackService.create(
                createRequest(AppFeedbackCategory.BUG, "이 화면에서 멈춥니다", List.of(file.getId())),
                member.getId());

        CommonFile linked = commonFileRepository.findById(file.getId()).orElseThrow();
        assertThat(linked.getTargetId()).isEqualTo(feedbackId);
        assertThat(linked.getFileStatus()).isEqualTo(FileStatus.COMPLETE);

        AppFeedbackDetailResponse detail = appFeedbackService.getDetail(feedbackId);
        assertThat(detail.memberName()).isEqualTo("테스트유저");
        assertThat(detail.images()).singleElement()
                .satisfies(image -> {
                    assertThat(image.fileId()).isEqualTo(file.getId());
                    assertThat(image.fileName()).isEqualTo("shot.png");
                    assertThat(image.url()).isNotBlank();
                });
    }

    @DisplayName("관리자는 상태로 필터링해 목록을 보고 상태와 메모를 저장할 수 있다")
    @Test
    void test5() {
        Long feedbackId = appFeedbackService.create(
                createRequest(AppFeedbackCategory.SHELTER_DATA, "대피소 주소가 틀렸습니다", null), null);

        appFeedbackService.updateByAdmin(feedbackId,
                new AppFeedbackAdminUpdateRequest(AppFeedbackStatus.IN_PROGRESS, "담당자 확인 요청"));

        AppFeedback updated = appFeedbackRepository.findById(feedbackId).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(AppFeedbackStatus.IN_PROGRESS);
        assertThat(updated.getAdminNote()).isEqualTo("담당자 확인 요청");

        PageResponse<AppFeedbackListResponse> inProgress = appFeedbackService.findFeedbacks(
                AppFeedbackStatus.IN_PROGRESS, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createDate")));
        assertThat(inProgress.content()).extracting(AppFeedbackListResponse::id).contains(feedbackId);

        PageResponse<AppFeedbackListResponse> resolved = appFeedbackService.findFeedbacks(
                AppFeedbackStatus.RESOLVED, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "createDate")));
        assertThat(resolved.content()).extracting(AppFeedbackListResponse::id).doesNotContain(feedbackId);
    }

    @DisplayName("회원 탈퇴로 작성자를 끊으면 피드백 행은 남고 회원ID만 비워진다")
    @Test
    void test6() {
        Member member = persistMember();
        Long feedbackId = appFeedbackService.create(
                createRequest(AppFeedbackCategory.CONTENT, "번역이 어색합니다", null), member.getId());

        appFeedbackService.detachMember(member.getId());

        AppFeedback detached = appFeedbackRepository.findById(feedbackId).orElseThrow();
        assertThat(detached.getMemberId()).isNull();
        assertThat(detached.getContent()).isEqualTo("번역이 어색합니다");
    }

    private Member persistMember() {
        return memberRepository.save(Member.builder()
                .memberName("테스트유저")
                .email("f" + System.nanoTime() + "@test.com")
                .socialType(SocialType.KAKAO)
                .socialId("feedback-" + System.nanoTime())
                .build());
    }

    private AppFeedbackCreateRequest createRequest(
            AppFeedbackCategory category, String content, List<Long> imageFileIds
    ) {
        return new AppFeedbackCreateRequest(
                category,
                content,
                "010-0000-0000",
                "1.0",
                "ANDROID",
                "14",
                "SM-S906N",
                "MapScreen",
                imageFileIds
        );
    }
}

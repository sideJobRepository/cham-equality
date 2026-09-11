package com.chamapi.feedback.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.feedback.dto.request.AppFeedbackAdminUpdateRequest;
import com.chamapi.feedback.dto.request.AppFeedbackCreateRequest;
import com.chamapi.feedback.dto.request.AppFeedbackUpdateRequest;
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

    @DisplayName("내 피드백 목록에는 내가 쓴 것만 나오고 남의 피드백은 빠진다")
    @Test
    void test7() {
        Member me = persistMember();
        Member other = persistMember();

        Long mine1 = appFeedbackService.create(
                createRequest(AppFeedbackCategory.BUG, "첫 번째 피드백", null), me.getId());
        Long mine2 = appFeedbackService.create(
                createRequest(AppFeedbackCategory.ETC, "두 번째 피드백", null), me.getId());
        Long others = appFeedbackService.create(
                createRequest(AppFeedbackCategory.ETC, "남의 피드백", null), other.getId());

        List<AppFeedbackListResponse> feedbacks = appFeedbackService.findMyFeedbacks(me.getId());

        assertThat(feedbacks).extracting(AppFeedbackListResponse::id)
                .containsExactlyInAnyOrder(mine1, mine2)
                .doesNotContain(others);
    }

    @DisplayName("본인이 접수 상태 피드백을 고치면 본문과 사진이 요청한 목록대로 교체된다")
    @Test
    void test8() {
        Member member = persistMember();
        CommonFile keep = persistFile("keep.png");
        CommonFile drop = persistFile("drop.png");
        CommonFile add = persistFile("add.png");

        Long feedbackId = appFeedbackService.create(
                createRequest(AppFeedbackCategory.BUG, "원래 내용", List.of(keep.getId(), drop.getId())),
                member.getId());

        appFeedbackService.updateByMember(feedbackId, member.getId(), new AppFeedbackUpdateRequest(
                AppFeedbackCategory.IMPROVEMENT, "고친 내용", "010-1111-2222", List.of(keep.getId(), add.getId())));

        AppFeedback updated = appFeedbackRepository.findById(feedbackId).orElseThrow();
        assertThat(updated.getContent()).isEqualTo("고친 내용");
        assertThat(updated.getCategory()).isEqualTo(AppFeedbackCategory.IMPROVEMENT);
        assertThat(updated.getContact()).isEqualTo("010-1111-2222");

        assertThat(commonFileRepository.findById(drop.getId()).orElseThrow().getFileStatus())
                .isEqualTo(FileStatus.TEMPORARY);
        assertThat(commonFileRepository.findById(add.getId()).orElseThrow().getTargetId())
                .isEqualTo(feedbackId);

        AppFeedbackDetailResponse detail = appFeedbackService.getMyDetail(feedbackId, member.getId());
        assertThat(detail.images()).extracting(AppFeedbackDetailResponse.ImageView::fileId)
                .containsExactlyInAnyOrder(keep.getId(), add.getId());
    }

    @DisplayName("남의 피드백이거나 접수 상태가 아니면 수정·삭제가 막히고 관리자 메모는 본인 상세에 안 나온다")
    @Test
    void test9() {
        Member me = persistMember();
        Member other = persistMember();
        Long feedbackId = appFeedbackService.create(
                createRequest(AppFeedbackCategory.BUG, "원래 내용", null), me.getId());

        AppFeedbackUpdateRequest request = new AppFeedbackUpdateRequest(
                AppFeedbackCategory.BUG, "고친 내용", null, null);

        assertThatThrownBy(() -> appFeedbackService.updateByMember(feedbackId, other.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("본인 피드백이 아니거나");
        assertThatThrownBy(() -> appFeedbackService.deleteByMember(feedbackId, other.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("본인 피드백이 아니거나");

        appFeedbackService.updateByAdmin(feedbackId,
                new AppFeedbackAdminUpdateRequest(AppFeedbackStatus.RECEIVED, "내부 메모"));
        assertThat(appFeedbackService.getMyDetail(feedbackId, me.getId()).adminNote()).isNull();
        assertThat(appFeedbackService.getDetail(feedbackId).adminNote()).isEqualTo("내부 메모");

        appFeedbackService.updateByAdmin(feedbackId,
                new AppFeedbackAdminUpdateRequest(AppFeedbackStatus.IN_PROGRESS, "내부 메모"));
        assertThatThrownBy(() -> appFeedbackService.updateByMember(feedbackId, me.getId(), request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("접수 상태");
        assertThatThrownBy(() -> appFeedbackService.deleteByMember(feedbackId, me.getId()))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("접수 상태");
    }

    @DisplayName("본인이 삭제하면 행은 지워지고 첨부는 임시 상태로 돌아간다")
    @Test
    void test10() {
        Member member = persistMember();
        CommonFile file = persistFile("shot.png");
        Long feedbackId = appFeedbackService.create(
                createRequest(AppFeedbackCategory.BUG, "잘못 올렸습니다", List.of(file.getId())), member.getId());

        appFeedbackService.deleteByMember(feedbackId, member.getId());

        assertThat(appFeedbackRepository.findById(feedbackId)).isEmpty();
        assertThat(commonFileRepository.findById(file.getId()).orElseThrow().getFileStatus())
                .isEqualTo(FileStatus.TEMPORARY);
    }

    private CommonFile persistFile(String fileName) {
        return commonFileRepository.save(CommonFile.builder()
                .fileName(fileName)
                .filePath("feedback/" + fileName)
                .fileType(FileType.FEEDBACK_IMAGE)
                .fileStatus(FileStatus.TEMPORARY)
                .build());
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

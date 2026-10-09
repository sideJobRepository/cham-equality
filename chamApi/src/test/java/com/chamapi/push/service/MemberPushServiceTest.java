package com.chamapi.push.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.common.dto.PageResponse;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.member.entity.Member;
import com.chamapi.member.enums.SocialType;
import com.chamapi.member.repository.MemberRepository;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.push.client.PushSender;
import com.chamapi.push.dto.request.MemberPushRequest;
import com.chamapi.push.dto.response.AdminMemberResponse;
import com.chamapi.push.entity.PushToken;
import com.chamapi.push.enums.PushPlatform;
import com.chamapi.push.repository.PushTokenRepository;
import com.chamapi.shelter.event.AppReportDecidedEvent.Result;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** 실제 FCM 대신 가짜 발송기를 주입해 대상 선정·검증·무효 토큰 정리만 확인한다. */
@Transactional
class MemberPushServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private PushTokenRepository pushTokenRepository;

    @DisplayName("회원의 기기에만 관리자가 쓴 제목·내용을 notice 타입으로 보낸다")
    @Test
    void test1() {
        Member target = saveMember("대상회원");
        Member other = saveMember("다른회원");
        saveToken("member-push-a", target.getId());
        saveToken("member-push-b", target.getId());
        saveToken("member-push-other", other.getId());
        FakeSender sender = new FakeSender();

        int sent = service(sender).sendToMember(target.getId(), new MemberPushRequest("제보 승인", "제보가 반영되었습니다."));

        assertThat(sent).isEqualTo(2);
        assertThat(sender.tokens).containsExactlyInAnyOrder("member-push-a", "member-push-b");
        assertThat(sender.title).isEqualTo("제보 승인");
        assertThat(sender.body).isEqualTo("제보가 반영되었습니다.");
        assertThat(sender.data).containsEntry("type", "notice");
    }

    @DisplayName("기기가 없는 회원이거나 제목·내용이 비었거나 길면 400")
    @Test
    void test2() {
        Member member = saveMember("기기없음");
        MemberPushService service = service(new FakeSender());

        assertThatThrownBy(() -> service.sendToMember(member.getId(), new MemberPushRequest("제목", "내용")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("기기가 없습니다");
        assertThatThrownBy(() -> service.sendToMember(member.getId(), new MemberPushRequest(" ", "내용")))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> service.sendToMember(member.getId(), new MemberPushRequest("제목", "x".repeat(501))))
                .isInstanceOf(BadRequestException.class);
    }

    @DisplayName("닿지 않는 토큰은 지우고, 전부 무효면 400이지만 정리는 남는다")
    @Test
    void test3() {
        Member member = saveMember("앱삭제");
        saveToken("member-push-dead", member.getId());
        FakeSender sender = new FakeSender();
        sender.invalid.add("member-push-dead");

        assertThatThrownBy(() -> service(sender).sendToMember(member.getId(), new MemberPushRequest("제목", "내용")))
                .isInstanceOf(BadRequestException.class);
        assertThat(pushTokenRepository.findAllByValue("member-push-dead")).isEmpty();
    }

    @DisplayName("회원 목록은 이름 검색이 되고 회원마다 알림 받을 기기 수를 준다(같은 토큰 중복 행은 1대)")
    @Test
    void test4() {
        String name = "검색회원" + System.nanoTime();
        Member member = saveMember(name);
        saveToken("member-push-count", member.getId());
        saveToken("member-push-count", member.getId());

        PageResponse<AdminMemberResponse> page = service(new FakeSender()).findMembers(name, PageRequest.of(0, 20));

        assertThat(page.content()).hasSize(1);
        assertThat(page.content().get(0).id()).isEqualTo(member.getId());
        assertThat(page.content().get(0).pushDeviceCount()).isEqualTo(1);
    }

    @DisplayName("개인 알림을 끈 기기는 관리자 알림 대상·기기 수에서 빠진다")
    @Test
    void test5() {
        Member member = saveMember("개인알림끔" + System.nanoTime());
        saveToken("member-push-on", member.getId());
        pushTokenRepository.save(PushToken.builder()
                .memberId(member.getId())
                .value("member-push-off")
                .platform(PushPlatform.ANDROID)
                .language(Language.KO)
                .personalEnabled(false)
                .lastActiveDate(LocalDateTime.now())
                .build());
        FakeSender sender = new FakeSender();

        int sent = service(sender).sendToMember(member.getId(), new MemberPushRequest("제목", "내용"));
        PageResponse<AdminMemberResponse> page = service(sender).findMembers(member.getMemberName(), PageRequest.of(0, 20));

        assertThat(sent).isEqualTo(1);
        assertThat(sender.tokens).containsExactly("member-push-on");
        assertThat(page.content().get(0).pushDeviceCount()).isEqualTo(1);
    }

    @DisplayName("제보 결과 알림은 기기 언어로, report 타입과 제보 id 를 담아 보낸다")
    @Test
    void test6() {
        Member member = saveMember("제보결과");
        pushTokenRepository.save(PushToken.builder()
                .memberId(member.getId())
                .value("member-push-en")
                .platform(PushPlatform.ANDROID)
                .language(Language.EN)
                .lastActiveDate(LocalDateTime.now())
                .build());
        FakeSender sender = new FakeSender();

        service(sender).sendReportResult(member.getId(), 77L, "한울아파트", Result.APPROVED);

        assertThat(sender.tokens).containsExactly("member-push-en");
        assertThat(sender.title).isEqualTo("Your report was approved");
        assertThat(sender.body).contains("한울아파트");
        assertThat(sender.data).containsEntry("type", "report").containsEntry("reportId", "77");
    }

    @DisplayName("제보 결과 알림은 받을 기기가 없어도 예외 없이 넘어간다")
    @Test
    void test7() {
        Member member = saveMember("기기없는제보자");
        FakeSender sender = new FakeSender();

        service(sender).sendReportResult(member.getId(), 1L, "대피소", Result.REJECTED);
        service(sender).sendReportResult(null, 1L, "대피소", Result.REJECTED);

        assertThat(sender.tokens).isEmpty();
    }

    private MemberPushService service(PushSender sender) {
        return new MemberPushService(memberRepository, pushTokenRepository, sender);
    }

    private Member saveMember(String name) {
        return memberRepository.save(Member.builder()
                .memberName(name)
                .email("p" + System.nanoTime() + "@test.com")
                .socialType(SocialType.KAKAO)
                .socialId("push-" + System.nanoTime())
                .build());
    }

    private void saveToken(String value, Long memberId) {
        pushTokenRepository.save(PushToken.builder()
                .memberId(memberId)
                .value(value)
                .platform(PushPlatform.ANDROID)
                .language(Language.KO)
                .lastActiveDate(LocalDateTime.now())
                .build());
    }

    private static class FakeSender implements PushSender {
        final Set<String> invalid = new HashSet<>();
        List<String> tokens = List.of();
        String title;
        String body;
        Map<String, String> data;

        @Override
        public boolean isEnabled() {
            return true;
        }

        @Override
        public List<String> send(List<String> tokens, String title, String body, Map<String, String> data) {
            this.tokens = tokens;
            this.title = title;
            this.body = body;
            this.data = data;
            return tokens.stream().filter(invalid::contains).toList();
        }
    }
}

package com.chamapi.push.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.member.entity.Member;
import com.chamapi.member.enums.SocialType;
import com.chamapi.member.repository.MemberRepository;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.push.dto.request.PushTokenRequest;
import com.chamapi.push.entity.PushToken;
import com.chamapi.push.enums.PushPlatform;
import com.chamapi.push.repository.PushTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class PushTokenServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private PushTokenService pushTokenService;

    @Autowired
    private PushTokenRepository pushTokenRepository;

    @Autowired
    private MemberRepository memberRepository;

    @DisplayName("처음 보는 토큰은 플랫폼·언어·활성 시각과 함께 새로 저장된다")
    @Test
    void test1() {
        pushTokenService.register(new PushTokenRequest("test-token-1", "android", "ko"), null);

        List<PushToken> saved = pushTokenRepository.findAllByValue("test-token-1");
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getPlatform()).isEqualTo(PushPlatform.ANDROID);
        assertThat(saved.get(0).getLanguage()).isEqualTo(Language.KO);
        assertThat(saved.get(0).getLastActiveDate()).isNotNull();
    }

    @DisplayName("같은 토큰을 다시 등록하면 행을 늘리지 않고 언어만 바꾼다")
    @Test
    void test2() {
        pushTokenService.register(new PushTokenRequest("test-token-2", "android", "ko"), null);
        pushTokenService.register(new PushTokenRequest("test-token-2", "android", "vi"), null);

        List<PushToken> saved = pushTokenRepository.findAllByValue("test-token-2");
        assertThat(saved).hasSize(1);
        assertThat(saved.get(0).getLanguage()).isEqualTo(Language.VI);
    }

    @DisplayName("해제하면 같은 값의 토큰 행이 모두 지워지고, 없는 토큰 해제도 오류가 아니다")
    @Test
    void test3() {
        pushTokenService.register(new PushTokenRequest("test-token-3", "android", "en"), null);

        pushTokenService.unregister("test-token-3");
        pushTokenService.unregister("test-token-never-registered");

        assertThat(pushTokenRepository.findAllByValue("test-token-3")).isEmpty();
    }

    @DisplayName("로그인 상태로 등록하면 회원이 연결되고, 로그아웃 후 재등록하면 연결이 끊긴다")
    @Test
    void test5() {
        Member member = memberRepository.save(Member.builder()
                .memberName("푸시테스트")
                .socialType(SocialType.KAKAO)
                .socialId("push-" + System.nanoTime())
                .build());

        pushTokenService.register(new PushTokenRequest("test-token-5", "android", "ko"), member.getId());
        assertThat(pushTokenRepository.findAllByValue("test-token-5").get(0).getMemberId()).isEqualTo(member.getId());

        pushTokenService.register(new PushTokenRequest("test-token-5", "android", "ko"), null);
        assertThat(pushTokenRepository.findAllByValue("test-token-5").get(0).getMemberId()).isNull();
    }

    @DisplayName("알림 설정을 보내면 저장하고, 안 보내면(예전 앱) 기존 값을 그대로 둔다")
    @Test
    void test6() {
        pushTokenService.register(new PushTokenRequest("test-token-6", "android", "ko", false, true), null);
        PushToken saved = pushTokenRepository.findAllByValue("test-token-6").get(0);
        assertThat(saved.isDisasterEnabled()).isFalse();
        assertThat(saved.isPersonalEnabled()).isTrue();

        pushTokenService.register(new PushTokenRequest("test-token-6", "android", "en"), null);
        assertThat(saved.isDisasterEnabled()).isFalse();
        assertThat(saved.getLanguage()).isEqualTo(Language.EN);

        pushTokenService.register(new PushTokenRequest("test-token-7", "android", "ko"), null);
        PushToken fresh = pushTokenRepository.findAllByValue("test-token-7").get(0);
        assertThat(fresh.isDisasterEnabled()).isTrue();
        assertThat(fresh.isPersonalEnabled()).isTrue();
    }

    @DisplayName("토큰·플랫폼·언어가 비었거나 지원하지 않는 값이면 400")
    @Test
    void test4() {
        assertThatThrownBy(() -> pushTokenService.register(new PushTokenRequest(" ", "android", "ko"), null))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> pushTokenService.register(new PushTokenRequest("t", null, "ko"), null))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> pushTokenService.register(new PushTokenRequest("t", "windows", "ko"), null))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> pushTokenService.register(new PushTokenRequest("t", "android", "fr"), null))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> pushTokenService.register(new PushTokenRequest("x".repeat(501), "android", "ko"), null))
                .isInstanceOf(BadRequestException.class);
    }
}

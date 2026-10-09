package com.chamapi.push.service;

import com.chamapi.RepositoryAndServiceTestSupport;
import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.enums.EmergencyStep;
import com.chamapi.disaster.repository.DisasterMessageRepository;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.service.MultilingualContentService;
import com.chamapi.multilingual.service.MultilingualContentService.Translated;
import com.chamapi.push.client.PushSender;
import com.chamapi.push.entity.PushToken;
import com.chamapi.push.enums.PushPlatform;
import com.chamapi.push.repository.PushTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 실제 FCM 대신 {@link FakeSender}로 갈아 끼워 발송 판단만 검증한다.
 * 운영 DB에 이미 있는 토큰·재난문자도 함께 처리될 수 있으므로, 단정은 이 테스트가 심은 토큰·문자로만 한다.
 */
@Transactional
class DisasterPushServiceTest extends RepositoryAndServiceTestSupport {

    @Autowired
    private DisasterMessageRepository disasterMessageRepository;

    @Autowired
    private MultilingualContentService multilingualContentService;

    @Autowired
    private PushTokenRepository pushTokenRepository;

    private final LocalDateTime now = LocalDateTime.of(2030, 1, 1, 12, 0);

    @DisplayName("기기 언어별 번역으로 보내고, 번역이 없는 언어는 한국어 원문으로 대신 보낸다")
    @Test
    void test1() {
        DisasterMessage message = saveMessage(now.minusMinutes(5));
        multilingualContentService.save(MultilingualContentService.TYPE_DISASTER_MESSAGE, message.getId(), Map.of(
                Language.KO, new Translated(null, "호우경보 발령", "호우"),
                Language.EN, new Translated(null, "Heavy rain warning", "Heavy rain")));
        saveToken("push-test-ko", Language.KO);
        saveToken("push-test-en", Language.EN);
        saveToken("push-test-ja", Language.JA);
        FakeSender sender = new FakeSender();

        service(sender).sendPending(now);

        assertThat(sender.bodyFor("push-test-ko")).isEqualTo("호우경보 발령");
        assertThat(sender.titleFor("push-test-ko")).isEqualTo("긴급재난문자 · 호우");
        assertThat(sender.bodyFor("push-test-en")).isEqualTo("Heavy rain warning");
        assertThat(sender.titleFor("push-test-en")).isEqualTo("Emergency Alert · Heavy rain");
        assertThat(sender.bodyFor("push-test-ja")).isEqualTo("원문 내용");
        assertThat(sender.dataFor("push-test-ko")).containsEntry("messageId", String.valueOf(message.getId()));
        assertThat(message.isPushWhether()).isTrue();
    }

    @DisplayName("발행 30분이 지난 문자는 보내지 않고 처리 완료로만 표시한다")
    @Test
    void test2() {
        DisasterMessage stale = saveMessage(now.minusMinutes(31));
        saveToken("push-test-stale", Language.KO);
        FakeSender sender = new FakeSender();

        service(sender).sendPending(now);

        assertThat(sender.bodyFor("push-test-stale")).isNull();
        assertThat(stale.isPushWhether()).isTrue();
    }

    @DisplayName("FCM 발송 자체가 실패하면 처리 표시를 하지 않아 다음 주기에 다시 보낸다")
    @Test
    void test3() {
        DisasterMessage message = saveMessage(now.minusMinutes(1));
        saveToken("push-test-fail", Language.KO);
        FakeSender sender = new FakeSender();
        sender.failAll = true;

        service(sender).sendPending(now);

        assertThat(message.isPushWhether()).isFalse();
    }

    @DisplayName("더는 닿지 않는 토큰은 발송 뒤 지운다")
    @Test
    void test4() {
        saveMessage(now.minusMinutes(1));
        saveToken("push-test-invalid", Language.KO);
        saveToken("push-test-valid", Language.KO);
        FakeSender sender = new FakeSender();
        sender.invalid.add("push-test-invalid");

        service(sender).sendPending(now);

        assertThat(pushTokenRepository.findAllByValue("push-test-invalid")).isEmpty();
        assertThat(pushTokenRepository.findAllByValue("push-test-valid")).hasSize(1);
    }

    @DisplayName("같은 토큰이 여러 행이어도 한 문자당 한 번만 보낸다")
    @Test
    void test5() {
        saveMessage(now.minusMinutes(1));
        saveToken("push-test-dup", Language.KO);
        saveToken("push-test-dup", Language.KO);
        FakeSender sender = new FakeSender();

        service(sender).sendPending(now);

        assertThat(sender.sentTokens).filteredOn("push-test-dup"::equals).hasSize(1);
    }

    @DisplayName("발송 키가 없으면 아무것도 보내지 않고 처리 표시도 하지 않는다")
    @Test
    void test6() {
        DisasterMessage message = saveMessage(now.minusMinutes(1));
        FakeSender sender = new FakeSender();
        sender.enabled = false;

        service(sender).sendPending(now);

        assertThat(sender.sentTokens).isEmpty();
        assertThat(message.isPushWhether()).isFalse();
    }

    @DisplayName("재난문자 알림을 끈 기기에는 보내지 않는다")
    @Test
    void test7() {
        saveMessage(now.minusMinutes(1));
        saveToken("push-test-on", Language.KO);
        pushTokenRepository.save(PushToken.builder()
                .value("push-test-off")
                .platform(PushPlatform.ANDROID)
                .language(Language.KO)
                .disasterEnabled(false)
                .lastActiveDate(now)
                .build());
        FakeSender sender = new FakeSender();

        service(sender).sendPending(now);

        assertThat(sender.sentTokens).contains("push-test-on").doesNotContain("push-test-off");
    }

    private DisasterPushService service(PushSender sender) {
        return new DisasterPushService(disasterMessageRepository, multilingualContentService, pushTokenRepository, sender);
    }

    private long snSeq = 9_200_000_000L + new Random().nextInt(1_000_000);

    private DisasterMessage saveMessage(LocalDateTime issuedAt) {
        return disasterMessageRepository.save(DisasterMessage.builder()
                .sn(snSeq++)
                .content("원문 내용")
                .regionName("대전광역시 서구")
                .emergencyStep(EmergencyStep.EMERGENCY)
                .category("호우")
                .issuedAt(issuedAt)
                .build());
    }

    private void saveToken(String value, Language language) {
        pushTokenRepository.save(PushToken.builder()
                .value(value)
                .platform(PushPlatform.ANDROID)
                .language(language)
                .lastActiveDate(now)
                .build());
    }

    /** 보낸 토큰별 제목·본문·데이터를 기록하는 가짜 발송기. */
    private static class FakeSender implements PushSender {
        boolean enabled = true;
        boolean failAll = false;
        final Set<String> invalid = new HashSet<>();
        final List<String> sentTokens = new ArrayList<>();
        private final Map<String, String[]> textByToken = new HashMap<>();
        private final Map<String, Map<String, String>> dataByToken = new HashMap<>();

        @Override
        public boolean isEnabled() {
            return enabled;
        }

        @Override
        public List<String> send(List<String> tokens, String title, String body, Map<String, String> data) {
            if (failAll) {
                throw new PushSendException("fake failure", null);
            }
            List<String> result = new ArrayList<>();
            for (String token : tokens) {
                sentTokens.add(token);
                textByToken.put(token, new String[]{title, body});
                dataByToken.put(token, data);
                if (invalid.contains(token)) {
                    result.add(token);
                }
            }
            return result;
        }

        String titleFor(String token) {
            String[] text = textByToken.get(token);
            return text == null ? null : text[0];
        }

        String bodyFor(String token) {
            String[] text = textByToken.get(token);
            return text == null ? null : text[1];
        }

        Map<String, String> dataFor(String token) {
            return dataByToken.get(token);
        }
    }
}

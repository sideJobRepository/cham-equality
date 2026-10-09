package com.chamapi.push.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.repository.DisasterMessageRepository;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.service.MultilingualContentService;
import com.chamapi.multilingual.service.MultilingualContentService.Translated;
import com.chamapi.push.client.PushSender;
import com.chamapi.push.client.PushSender.PushSendException;
import com.chamapi.push.entity.PushToken;
import com.chamapi.push.repository.PushTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 새 재난문자를 기기 언어별 번역으로 푸시한다. 스케줄러가 적재·번역 다음 단계로 호출한다.
 *
 * <p>발송 대상은 {@code PUSH_WHETHER=false}인 문자다. 발송을 마치면 true로 마킹하고,
 * FCM 자체가 실패하면 마킹하지 않아 다음 5분 주기에 다시 시도한다.
 * 발행 후 {@link #STALE_MINUTES}분이 지난 문자는 보내지 않고 마킹만 한다 — 서버가 오래 멈췄다 살아날 때
 * 지난 문자가 한꺼번에 울리는 것을 막기 위해서다.
 *
 * <p>번역이 없는 언어는 한국어 원문으로 대신 보낸다. 재난 알림은 번역 재시도를 기다릴 만큼 여유가 없다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DisasterPushService {

    static final long STALE_MINUTES = 30;
    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    // 알림 제목. 카테고리(호우·지진 등)가 있으면 뒤에 붙인다.
    private static final Map<Language, String> TITLES = Map.of(
            Language.KO, "긴급재난문자",
            Language.EN, "Emergency Alert",
            Language.ZH, "紧急灾难短信",
            Language.JA, "緊急災害メール",
            Language.VI, "Cảnh báo khẩn cấp");

    private final DisasterMessageRepository disasterMessageRepository;
    private final MultilingualContentService multilingualContentService;
    private final PushTokenRepository pushTokenRepository;
    private final PushSender pushSender;

    @Transactional
    public void sendPending() {
        sendPending(LocalDateTime.now(KST));
    }

    @Transactional
    public void sendPending(LocalDateTime now) {
        if (!pushSender.isEnabled()) {
            return;
        }
        List<DisasterMessage> pending = disasterMessageRepository.findPushPending();
        if (pending.isEmpty()) {
            return;
        }

        LocalDateTime staleBefore = now.minusMinutes(STALE_MINUTES);
        List<DisasterMessage> fresh = new ArrayList<>();
        for (DisasterMessage message : pending) {
            if (message.getIssuedAt() == null || message.getIssuedAt().isBefore(staleBefore)) {
                message.markPushed();
            } else {
                fresh.add(message);
            }
        }
        if (fresh.isEmpty()) {
            return;
        }

        Map<Language, List<String>> tokensByLanguage = loadTokensByLanguage();
        Map<Long, Map<Language, Translated>> translations = loadTranslations(fresh);

        // 오래된 것부터 보내 기기 알림 순서가 발행 순서와 맞게 한다.
        fresh.sort(Comparator.comparing(DisasterMessage::getIssuedAt));
        for (DisasterMessage message : fresh) {
            try {
                send(message, translations.getOrDefault(message.getId(), Map.of()), tokensByLanguage);
                message.markPushed();
            } catch (PushSendException e) {
                log.warn("disaster push failed, will retry. messageId={} reason={}", message.getId(), e.getMessage());
            }
        }
    }

    /**
     * 관리자 테스트 발송 — 가장 최근 재난문자를 지정한 토큰 하나에만 보낸다.
     * 토큰이 등록돼 있으면 그 언어로, 없으면 한국어로 보낸다. {@code PUSH_WHETHER}는 건드리지 않는다.
     */
    @Transactional
    public void sendTest(String token) {
        if (token == null || token.isBlank()) {
            throw new BadRequestException("토큰은 필수입니다.");
        }
        if (!pushSender.isEnabled()) {
            throw new BadRequestException("푸시 발송 키가 설정되지 않았습니다.");
        }
        DisasterMessage message = disasterMessageRepository.findLatestOne()
                .orElseThrow(() -> new BadRequestException("보낼 재난문자가 없습니다."));
        String trimmed = token.trim();
        Language language = pushTokenRepository.findAllByValue(trimmed).stream()
                .map(PushToken::getLanguage)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(Language.KO);

        Map<Language, Translated> translated = loadTranslations(List.of(message)).getOrDefault(message.getId(), Map.of());
        List<String> invalid = sendTo(List.of(trimmed), message, language, translated);
        if (!invalid.isEmpty()) {
            pushTokenRepository.deleteAllByValueIn(invalid);
            throw new BadRequestException("유효하지 않은 토큰입니다(삭제됨).");
        }
    }

    private void send(DisasterMessage message, Map<Language, Translated> translated, Map<Language, List<String>> tokensByLanguage) {
        List<String> invalid = new ArrayList<>();
        tokensByLanguage.forEach((language, tokens) ->
                invalid.addAll(sendTo(tokens, message, language, translated)));
        if (!invalid.isEmpty()) {
            pushTokenRepository.deleteAllByValueIn(invalid);
            log.info("removed invalid push tokens count={}", invalid.size());
        }
    }

    private List<String> sendTo(List<String> tokens, DisasterMessage message, Language language, Map<Language, Translated> translated) {
        Translated text = translated.get(language);
        String body = text != null && hasText(text.cont()) ? text.cont() : message.getContent();
        String category = text != null && hasText(text.category()) ? text.category() : message.getCategory();
        String title = hasText(category) ? TITLES.get(language) + " · " + category : TITLES.get(language);
        Map<String, String> data = Map.of(
                "type", "disaster",
                "messageId", String.valueOf(message.getId()));
        return pushSender.send(tokens, title, body, data);
    }

    /** 재난 알림을 켠 기기의 언어별 토큰. UNIQUE 제약이 없어 같은 토큰이 여러 행일 수 있으므로 값으로 중복을 거른다(먼저 나온 행의 언어 기준). */
    private Map<Language, List<String>> loadTokensByLanguage() {
        Map<String, Language> languageByToken = new LinkedHashMap<>();
        for (PushToken token : pushTokenRepository.findAllDisasterEnabled()) {
            if (hasText(token.getValue()) && token.getLanguage() != null) {
                languageByToken.putIfAbsent(token.getValue(), token.getLanguage());
            }
        }
        return languageByToken.entrySet().stream()
                .collect(Collectors.groupingBy(
                        Map.Entry::getValue,
                        () -> new EnumMap<>(Language.class),
                        Collectors.mapping(Map.Entry::getKey, Collectors.toList())));
    }

    private Map<Long, Map<Language, Translated>> loadTranslations(List<DisasterMessage> messages) {
        return multilingualContentService.load(
                MultilingualContentService.TYPE_DISASTER_MESSAGE,
                messages.stream().map(DisasterMessage::getId).toList(),
                List.of(Language.values()));
    }

    private static boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}

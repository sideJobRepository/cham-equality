package com.chamapi.push.service;

import com.chamapi.common.dto.PageResponse;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.member.entity.Member;
import com.chamapi.member.repository.MemberRepository;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.push.client.PushSender;
import com.chamapi.push.client.PushSender.PushSendException;
import com.chamapi.push.dto.request.MemberPushRequest;
import com.chamapi.push.dto.response.AdminMemberResponse;
import com.chamapi.push.entity.PushToken;
import com.chamapi.push.repository.PushTokenRepository;
import com.chamapi.shelter.event.AppReportDecidedEvent.Result;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * 관리자 웹의 회원 조회 + 회원 지정 푸시.
 *
 * <p>푸시 대상은 그 회원으로 로그인한 상태에서 토큰을 등록한 기기다. 비로그인 기기는 회원을 특정할 수 없어 대상이 아니다.
 * 알림 데이터 {@code type}은 {@code notice}로, 앱은 재난문자({@code disaster})와 구분해 처리한다.
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class MemberPushService {

    private static final int TITLE_MAX_LENGTH = 50;
    private static final int BODY_MAX_LENGTH = 500;

    private final MemberRepository memberRepository;
    private final PushTokenRepository pushTokenRepository;
    private final PushSender pushSender;

    /** 회원 목록(이름·이메일 검색). 회원마다 개인 알림을 켠 기기 수를 함께 준다. */
    public PageResponse<AdminMemberResponse> findMembers(String keyword, Pageable pageable) {
        Page<Member> members = memberRepository.searchByNameOrEmail(keyword, pageable);

        List<Long> memberIds = members.getContent().stream().map(Member::getId).toList();
        Map<Long, Long> deviceCounts = pushTokenRepository.findAllPersonalEnabledByMemberIds(memberIds).stream()
                .collect(Collectors.groupingBy(
                        PushToken::getMemberId,
                        Collectors.mapping(PushToken::getValue, Collectors.collectingAndThen(Collectors.toSet(), set -> (long) set.size()))));

        return PageResponse.from(members.map(member ->
                AdminMemberResponse.of(member, deviceCounts.getOrDefault(member.getId(), 0L).intValue())));
    }

    /**
     * 회원의 모든 기기에 관리자 알림을 보낸다. 닿지 않는 토큰은 지운다.
     *
     * @return 실제로 보낸 기기 수
     */
    // 전부 무효라 400을 던질 때도 무효 토큰 삭제는 남겨야 해서 롤백하지 않는다(그 전의 검증 예외는 쓰기 전이라 무관).
    @Transactional(noRollbackFor = BadRequestException.class)
    public int sendToMember(Long memberId, MemberPushRequest request) {
        String title = require(request.title(), "제목", TITLE_MAX_LENGTH);
        String body = require(request.body(), "내용", BODY_MAX_LENGTH);
        if (!pushSender.isEnabled()) {
            throw new BadRequestException("푸시 발송 키가 설정되지 않았습니다.");
        }
        if (!memberRepository.existsById(memberId)) {
            throw new BadRequestException("회원을 찾을 수 없습니다.");
        }

        List<String> tokens = pushTokenRepository.findAllPersonalEnabledByMemberId(memberId).stream()
                .map(PushToken::getValue)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (tokens.isEmpty()) {
            throw new BadRequestException("이 회원은 알림을 받을 기기가 없습니다(앱 로그인·알림 등록 필요, 또는 개인 알림을 꺼 둠).");
        }

        List<String> invalid;
        try {
            invalid = pushSender.send(tokens, title, body, Map.of("type", "notice"));
        } catch (PushSendException e) {
            throw new BadRequestException("발송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        }
        if (!invalid.isEmpty()) {
            pushTokenRepository.deleteAllByValueIn(invalid);
        }
        int sent = tokens.size() - invalid.size();
        if (sent == 0) {
            throw new BadRequestException("이 회원의 기기에 더는 알림이 닿지 않습니다(앱 삭제 등). 등록된 기기를 정리했습니다.");
        }
        return sent;
    }

    /**
     * 앱 제보 처리 결과를 제보한 회원에게 알린다. 기기마다 앱 언어로 보낸다.
     * 제보 승인·반려 트랜잭션이 커밋된 뒤 불리므로 자기 트랜잭션에서 무효 토큰을 정리한다.
     * 받을 기기가 없거나 발송이 실패해도 제보 처리에는 영향이 없게 조용히 넘긴다.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendReportResult(Long memberId, Long reportId, String shelterName, Result result) {
        if (memberId == null || !pushSender.isEnabled()) {
            return;
        }
        Map<Language, List<String>> tokensByLanguage = new EnumMap<>(Language.class);
        pushTokenRepository.findAllPersonalEnabledByMemberId(memberId).stream()
                .filter(token -> token.getValue() != null)
                .forEach(token -> tokensByLanguage
                        .computeIfAbsent(token.getLanguage() != null ? token.getLanguage() : Language.KO, key -> new ArrayList<>())
                        .add(token.getValue()));

        List<String> invalid = new ArrayList<>();
        Map<String, String> data = Map.of("type", "report", "reportId", String.valueOf(reportId));
        tokensByLanguage.forEach((language, tokens) -> {
            ReportResultText text = ReportResultText.of(result, language);
            try {
                invalid.addAll(pushSender.send(tokens.stream().distinct().toList(),
                        text.title(), text.body(shelterName), data));
            } catch (PushSendException e) {
                log.warn("report result push failed memberId={} reportId={} reason={}", memberId, reportId, e.getMessage());
            }
        });
        if (!invalid.isEmpty()) {
            pushTokenRepository.deleteAllByValueIn(invalid);
        }
    }

    private String require(String value, String label, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(label + "은(는) 필수입니다.");
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLength) {
            throw new BadRequestException(label + "은(는) " + maxLength + "자 이하로 입력해 주세요.");
        }
        return trimmed;
    }
}

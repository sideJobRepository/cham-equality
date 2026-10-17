package com.chamapi.member.service.impl;

import com.chamapi.authentication.repository.RefreshTokenRepository;
import com.chamapi.authorization.service.MemberRoleService;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.feedback.service.AppFeedbackService;
import com.chamapi.member.entity.Member;
import com.chamapi.member.enums.SocialType;
import com.chamapi.member.repository.MemberRepository;
import com.chamapi.member.service.MemberService;
import com.chamapi.security.service.AppleRevokeService;
import com.chamapi.shelter.service.ShelterInfoAppReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class MemberServiceImpl implements MemberService {

    private final MemberRepository memberRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final MemberRoleService memberRoleService;
    private final ShelterInfoAppReportService shelterInfoAppReportService;
    private final AppFeedbackService appFeedbackService;
    private final AppleRevokeService appleRevokeService;

    /**
     * 삭제 순서는 FK 역순: 앱 제보 -> 앱 피드백 작성자 해제 -> 권한 매핑 -> refresh 토큰 -> 회원.
     * 승인된 앱 제보의 사진은 이미 대피소 공개 데이터라 유지되고, 미승인 제보 사진만 정리된다.
     * 앱 피드백은 FK가 RESTRICT라 작성자 참조만 끊고(익명화) 내용은 베타 기간 기록으로 남긴다.
     * 애플 회원은 DB를 지우기 전에 애플 토큰부터 철회한다(App Store 심사 5.1.1(v)). 철회가 실패하면
     * 예외로 탈퇴 전체를 중단해, 애플 연결만 남은 채 계정이 사라지는 일이 없게 한다.
     */
    @Override
    public void withdraw(Long memberId, String appleAuthorizationCode) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 회원입니다: " + memberId));

        if (member.getSocialType() == SocialType.APPLE) {
            appleRevokeService.revokeByAuthorizationCode(appleAuthorizationCode);
        }

        shelterInfoAppReportService.deleteAllByMember(memberId);
        appFeedbackService.detachMember(memberId);
        memberRoleService.deleteByMember(memberId);
        refreshTokenRepository.findMember(member).ifPresent(refreshTokenRepository::delete);
        memberRepository.delete(member);
    }
}

package com.chamapi.member.service.impl;

import com.chamapi.authentication.repository.RefreshTokenRepository;
import com.chamapi.authorization.service.MemberRoleService;
import com.chamapi.common.exception.BadRequestException;
import com.chamapi.member.entity.Member;
import com.chamapi.member.repository.MemberRepository;
import com.chamapi.member.service.MemberService;
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

    /**
     * 삭제 순서는 FK 역순: 앱 제보 -> 권한 매핑 -> refresh 토큰 -> 회원.
     * 승인된 앱 제보의 사진은 이미 대피소 공개 데이터라 유지되고, 미승인 제보 사진만 정리된다.
     */
    @Override
    public void withdraw(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new BadRequestException("존재하지 않는 회원입니다: " + memberId));

        shelterInfoAppReportService.deleteAllByMember(memberId);
        memberRoleService.deleteByMember(memberId);
        refreshTokenRepository.findMember(member).ifPresent(refreshTokenRepository::delete);
        memberRepository.delete(member);
    }
}

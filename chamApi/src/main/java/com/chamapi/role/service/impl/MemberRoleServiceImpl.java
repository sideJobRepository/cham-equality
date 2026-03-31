package com.chamapi.role.service.impl;


import com.chamapi.role.entity.MemberRole;
import com.chamapi.role.repository.MemberRoleRepository;
import com.chamapi.role.service.MemberRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Transactional
@Service
@RequiredArgsConstructor
public class MemberRoleServiceImpl implements MemberRoleService {
    
    private final MemberRoleRepository memberRoleRepository;
    @Override
    public MemberRole getMemberRole(Long memberId) {
        return memberRoleRepository.findByMemberId(memberId).orElseThrow(() -> new RuntimeException("회원 권한을 찾을수가 없습니다."));
    }
}

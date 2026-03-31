package com.chamapi.security.service.impl;


import com.chamapi.member.entrity.Member;
import com.chamapi.member.repository.MemberRepository;
import com.chamapi.memberrole.entity.MemberRole;
import com.chamapi.memberrole.repository.MemberRoleRepository;
import com.chamapi.role.entity.Role;
import com.chamapi.role.repository.RoleRepository;
import com.chamapi.security.context.MemberContext;
import com.chamapi.security.service.social.SocialProfile;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;


@Service
@RequiredArgsConstructor
@Transactional
public class MemberDetailServiceImpl implements UserDetailsService {
    
    private final MemberRepository memberRepository;
    
    private final RoleRepository roleRepository;
    
    private final MemberRoleRepository memberRoleRepository;
    
    
    
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        return null;
    }
    
    public UserDetails loadUserByUsername(SocialProfile socialProfile) {
        
        Member findMember = memberRepository.findByMemberSocialId(String.valueOf(socialProfile.sub()))
                .orElseGet(() -> {
                    Member member = new Member(socialProfile);
                    Member saveMember = memberRepository.save(member);
                    
                    Role role = roleRepository.findByRoleName("USER");
                    
                    MemberRole saveMemberRole = MemberRole.builder()
                            .member(saveMember)
                            .role(role)
                            .build();
                    memberRoleRepository.save(saveMemberRole);
                    return saveMember;
                });
        
        Long id = findMember.getId();
        List<String> roleName = memberRoleRepository.findByRoleName(id);
        List<GrantedAuthority> authorityList = AuthorityUtils.createAuthorityList(roleName);
        
        return new MemberContext(findMember, authorityList);
    }
    
    
}

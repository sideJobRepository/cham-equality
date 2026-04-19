package com.chamapi.member.dto;


import com.chamapi.member.entity.Member;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
public class MemberResponseDto {

    private Long id;
    private String name;
    private List<String> roles;
    private String socialId;
    private String sub;
    
    public static MemberResponseDto create(Member member, List<GrantedAuthority> authorities) {
        MemberResponseDto memberResponseDto = new MemberResponseDto();
        memberResponseDto.setId(member.getId());
        memberResponseDto.setName(member.getMemberName());
        List<String> roleList = new ArrayList<>();
        if (authorities != null && !authorities.isEmpty()) {
            for (GrantedAuthority auth : authorities) {
                roleList.add("ROLE_" + auth.getAuthority());
            }
        }
        memberResponseDto.setRoles(roleList);
        memberResponseDto.setSocialId(member.getSocialId());
        memberResponseDto.setSub("user");
        return memberResponseDto;
    }
}

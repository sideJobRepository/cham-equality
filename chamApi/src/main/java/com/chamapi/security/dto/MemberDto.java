package com.chamapi.security.dto;

import com.chamapi.member.entrity.Member;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class MemberDto {
    
    
    private Long id;
    
    private String email;
    
    private String name;
    
    private String socialType;
    
    private String socialId;
    
    private List<String> roles;
    
    public static MemberDto createMemberDto(Member member, List<String> roles){
        MemberDto memberdto = new MemberDto();
        memberdto.id =  member.getId();
        memberdto.email = member.getEmail();
        memberdto.name = member.getMemberName();
        memberdto.socialId = member.getSocialId();
        memberdto.socialType = member.getSocialType().name();
        memberdto.roles = roles;
        return memberdto;
    }
}

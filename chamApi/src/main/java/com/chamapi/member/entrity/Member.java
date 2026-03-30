package com.chamapi.member.entrity;

import com.chamapi.mapperd.DateSuperClass;
import com.chamapi.member.enums.SocialType;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "MEMBER")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Member extends DateSuperClass {
    
    // 회원 ID
    @Id
    @Column(name = "MEMBER_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;
    
    // 회원 이메일
    @Column(name = "MEMBER_EMAIL")
    private String email;
    
    // 회원 이름
    @Column(name = "MEMBER_NAME")
    private String memberName;
    
    // 회원 소셜 타입
    @Enumerated(EnumType.STRING)
    @Column(name = "MEMBER_SOCIAL_TYPE")
    private SocialType socialType;
    
    // 회원 소셜 ID
    @Column(name = "MEMBER_SOCIAL_ID")
    private String socialId;
    
    // 회원 폰 번호
    @Column(name = "MEMBER_PHONE_NO")
    private String phoneNo;
    
    
}

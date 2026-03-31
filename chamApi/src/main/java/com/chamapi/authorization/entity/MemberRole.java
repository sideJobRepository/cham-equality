package com.chamapi.authorization.entity;


import com.chamapi.common.entity.DateSuperClass;

import com.chamapi.member.entity.Member;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "MEMBER_ROLE")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MemberRole extends DateSuperClass {

    
      @Id
      @Column(name = "MEMBER_ROLE_ID")
      @GeneratedValue(strategy = IDENTITY)
      private Long id;
      
      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "MEMBER_ID")
      private Member member;
      
      @ManyToOne(fetch = FetchType.LAZY)
      @JoinColumn(name = "ROLE_ID")
      private Role role;
}

package com.chamapi.refresh.entity;

import com.chamapi.mapperd.DateSuperClass;
import com.chamapi.member.entrity.Member;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Getter
@Table(name = "REFRESH_TOKEN")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class RefreshToken extends DateSuperClass {
    
    // BGM 아지트 리프레쉬 토큰 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "REFRESH_TOKEN_ID")
    private Long id;
    
    // BGM 아지트 회원 ID
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MEMBER_ID")
    private Member member;
    
    // BGM 아지트 리프레쉬 토큰 값
    @Column(name = "REFRESH_TOKEN_VALUE")
    private String refreshTokenValue;
    
    // BGM 아지트 리프레쉬 만료 일시
    @Column(name = "REFRESH_EXPIRES_DATE")
    private LocalDateTime refreshExpiresDate;
    
    // BGM 아지트 리프레쉬 플랫폼 ID
    @Column(name = "REFRESH_PLATFORM_ID")
    private String refreshPlatformId;
    
    public void updateToken(String refreshTokenValue, LocalDateTime expiresAt) {
        this.refreshTokenValue = refreshTokenValue;
        this.refreshExpiresDate = expiresAt;
    }
}

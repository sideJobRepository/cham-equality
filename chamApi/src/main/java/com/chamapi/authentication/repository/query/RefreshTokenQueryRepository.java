package com.chamapi.authentication.repository.query;



import com.chamapi.member.entity.Member;
import com.chamapi.authentication.entity.RefreshToken;

import java.util.Optional;

public interface RefreshTokenQueryRepository {
    
    Optional<RefreshToken> findMember(Member member);
    
    Optional<RefreshToken> findRefreshTokenValue(String refreshTokenValue);
}

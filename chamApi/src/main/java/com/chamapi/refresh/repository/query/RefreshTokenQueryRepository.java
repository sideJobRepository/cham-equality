package com.chamapi.refresh.repository.query;



import com.chamapi.member.entrity.Member;
import com.chamapi.refresh.entity.RefreshToken;

import java.util.Optional;

public interface RefreshTokenQueryRepository {
    
    Optional<RefreshToken> findPortfolioMember(Member member);
    
    Optional<RefreshToken> findPortfolioRefreshTokenValue(String refreshTokenValue);
    
    void deleteByMember(Long id);
}

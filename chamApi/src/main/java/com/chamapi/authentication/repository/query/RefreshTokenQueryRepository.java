package com.chamapi.authentication.repository.query;



import com.chamapi.member.entity.Member;
import com.chamapi.authentication.entity.RefreshToken;

import java.util.Optional;

public interface RefreshTokenQueryRepository {
    
    Optional<RefreshToken> findPortfolioMember(Member member);
    
    Optional<RefreshToken> findPortfolioRefreshTokenValue(String refreshTokenValue);
    
    void deleteByMember(Long id);
}

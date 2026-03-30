package com.chamapi.refresh.repository;


import com.chamapi.refresh.entity.RefreshToken;
import com.chamapi.refresh.repository.query.RefreshTokenQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken,Long>, RefreshTokenQueryRepository {
}

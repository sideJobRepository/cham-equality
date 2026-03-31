package com.chamapi.authentication.repository;


import com.chamapi.authentication.entity.RefreshToken;
import com.chamapi.authentication.repository.query.RefreshTokenQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken,Long>, RefreshTokenQueryRepository {
}

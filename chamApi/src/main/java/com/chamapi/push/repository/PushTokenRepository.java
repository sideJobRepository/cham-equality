package com.chamapi.push.repository;

import com.chamapi.push.entity.PushToken;
import com.chamapi.push.repository.query.PushTokenQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PushTokenRepository extends JpaRepository<PushToken, Long>, PushTokenQueryRepository {
}

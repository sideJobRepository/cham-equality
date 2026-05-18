package com.chamapi.disaster.repository;

import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.repository.query.DisasterMessageQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DisasterMessageRepository extends JpaRepository<DisasterMessage, Long>, DisasterMessageQueryRepository {

    Optional<DisasterMessage> findBySn(Long sn);
}

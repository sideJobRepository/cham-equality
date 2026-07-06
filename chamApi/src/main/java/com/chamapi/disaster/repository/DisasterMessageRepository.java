package com.chamapi.disaster.repository;

import com.chamapi.disaster.entity.DisasterMessage;
import com.chamapi.disaster.repository.query.DisasterMessageQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DisasterMessageRepository extends JpaRepository<DisasterMessage, Long>, DisasterMessageQueryRepository {

    Optional<DisasterMessage> findBySn(Long sn);

    /** 아직 번역되지 않은 재난문자 (스케줄러 재시도 대상). */
    List<DisasterMessage> findByTranslationWhetherFalse();
}

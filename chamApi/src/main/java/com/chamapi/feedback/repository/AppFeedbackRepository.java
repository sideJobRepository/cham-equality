package com.chamapi.feedback.repository;

import com.chamapi.feedback.entity.AppFeedback;
import com.chamapi.feedback.enums.AppFeedbackStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * 조건이 상태 필터 하나뿐이라 QueryDSL 트리오 없이 파생 쿼리만 쓴다
 * (형제 {@code ShelterInfoAppReportRepository}와 동일한 판단).
 */
public interface AppFeedbackRepository extends JpaRepository<AppFeedback, Long> {

    Page<AppFeedback> findAllByStatus(AppFeedbackStatus status, Pageable pageable);

    List<AppFeedback> findAllByMemberId(Long memberId);
}

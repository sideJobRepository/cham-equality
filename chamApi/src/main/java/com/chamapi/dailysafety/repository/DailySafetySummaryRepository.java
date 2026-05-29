package com.chamapi.dailysafety.repository;

import com.chamapi.dailysafety.entity.DailySafetySummary;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface DailySafetySummaryRepository extends JpaRepository<DailySafetySummary, Long> {

    @Query("""
            select s
            from DailySafetySummary s
            order by s.createDate desc
            limit 1
            """)
    Optional<DailySafetySummary> findLatest();
}

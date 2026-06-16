package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.ShelterInfoAppReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShelterInfoAppReportRepository extends JpaRepository<ShelterInfoAppReport, Long> {

    List<ShelterInfoAppReport> findAllByMemberIdOrderByCreateDateDesc(Long memberId);

    /** 소유권 검증 겸용. 본인(memberId) 제보가 아니면 비어 있음. */
    Optional<ShelterInfoAppReport> findByIdAndMemberId(Long id, Long memberId);
}

package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.ShelterInfoAppReport;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShelterInfoAppReportRepository extends JpaRepository<ShelterInfoAppReport, Long> {

    List<ShelterInfoAppReport> findAllByMemberIdOrderByCreateDateDesc(Long memberId);

    /** 소유권 검증 겸용. 본인(memberId) 제보가 아니면 비어 있음. */
    Optional<ShelterInfoAppReport> findByIdAndMemberId(Long id, Long memberId);

    /** 관리자 목록: 상태별 페이지네이션. */
    Page<ShelterInfoAppReport> findAllByRequestStatus(ShelterInfoReportStatus status, Pageable pageable);

    /** 승인/반려 시 같은 대피소의 특정 상태 제보를 최신순으로. */
    List<ShelterInfoAppReport> findAllByShelterIdAndRequestStatusOrderByCreateDateDesc(
            Long shelterId, ShelterInfoReportStatus status
    );
}

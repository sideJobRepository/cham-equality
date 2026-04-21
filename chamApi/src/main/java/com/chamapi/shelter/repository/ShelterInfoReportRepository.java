package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.ShelterInfoReport;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ShelterInfoReportRepository extends JpaRepository<ShelterInfoReport, Long> {

    Page<ShelterInfoReport> findAllByRequestStatus(ShelterInfoReportStatus status, Pageable pageable);

    List<ShelterInfoReport> findAllByShelterIdAndRequestStatusOrderByCreateDateDesc(
            Long shelterId, ShelterInfoReportStatus status
    );

    @Query("SELECT r.shelterId, COUNT(r) FROM ShelterInfoReport r " +
            "WHERE r.shelterId IN :shelterIds AND r.requestStatus = :status " +
            "GROUP BY r.shelterId")
    List<Object[]> countByShelterIdInAndRequestStatus(
            @Param("shelterIds") Collection<Long> shelterIds,
            @Param("status") ShelterInfoReportStatus status
    );
}

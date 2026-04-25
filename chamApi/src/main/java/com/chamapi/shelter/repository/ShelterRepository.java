package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.enums.ShelterSurveyStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {

    String KEYWORD_PREDICATE =
            "(:keyword IS NULL OR :keyword = '' " +
                    " OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    " OR LOWER(s.address) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
                    " OR LOWER(s.oldAddress) LIKE LOWER(CONCAT('%', :keyword, '%')))";

    @Query("SELECT s FROM Shelter s WHERE " + KEYWORD_PREDICATE)
    Page<Shelter> search(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT s FROM Shelter s WHERE " + KEYWORD_PREDICATE +
            " AND s.surveyStatus = :status")
    Page<Shelter> searchByStatus(
            @Param("keyword") String keyword,
            @Param("status") ShelterSurveyStatus status,
            Pageable pageable
    );

    @Query("SELECT s FROM Shelter s WHERE " + KEYWORD_PREDICATE +
            " AND s.surveyStatus = com.chamapi.shelter.enums.ShelterSurveyStatus.NOT_INVESTIGATED " +
            " AND EXISTS (SELECT r FROM ShelterInfoReport r " +
            "             WHERE r.shelterId = s.id " +
            "               AND r.requestStatus = com.chamapi.shelter.enums.ShelterInfoReportStatus.PENDING)")
    Page<Shelter> searchSubmitted(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT s FROM Shelter s WHERE " + KEYWORD_PREDICATE +
            " AND s.surveyStatus = com.chamapi.shelter.enums.ShelterSurveyStatus.NOT_INVESTIGATED " +
            " AND NOT EXISTS (SELECT r FROM ShelterInfoReport r " +
            "                 WHERE r.shelterId = s.id " +
            "                   AND r.requestStatus = com.chamapi.shelter.enums.ShelterInfoReportStatus.PENDING)")
    Page<Shelter> searchNotSubmitted(@Param("keyword") String keyword, Pageable pageable);
}

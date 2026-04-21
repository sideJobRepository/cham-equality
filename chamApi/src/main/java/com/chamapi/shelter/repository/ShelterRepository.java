package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.Shelter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {

    @Query("SELECT s FROM Shelter s WHERE " +
            "(:keyword IS NULL OR :keyword = '' " +
            " OR LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
            " OR LOWER(s.address) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Shelter> search(@Param("keyword") String keyword, Pageable pageable);
}

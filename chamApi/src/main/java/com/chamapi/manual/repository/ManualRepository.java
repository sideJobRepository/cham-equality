package com.chamapi.manual.repository;

import com.chamapi.manual.entity.Manual;
import com.chamapi.multilingual.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ManualRepository extends JpaRepository<Manual, Long> {

    List<Manual> findByLanguage(Language language);

    List<Manual> findAllByOrderByIdDesc();

    @Query("SELECT m FROM Manual m " +
            "WHERE m.language = :language " +
            "AND LOWER(m.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Manual> searchByTitle(@Param("language") Language language, @Param("query") String query);
}

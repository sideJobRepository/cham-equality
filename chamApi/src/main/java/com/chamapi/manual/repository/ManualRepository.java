package com.chamapi.manual.repository;

import com.chamapi.manual.entity.Manual;
import com.chamapi.multilingual.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ManualRepository extends JpaRepository<Manual, Long> {

    List<Manual> findByLanguage(Language language);

    List<Manual> findAllByOrderByIdDesc();
}

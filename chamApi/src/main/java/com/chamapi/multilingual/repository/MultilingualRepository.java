package com.chamapi.multilingual.repository;

import com.chamapi.multilingual.entity.Multilingual;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MultilingualRepository
        extends JpaRepository<Multilingual, Long>, MultilingualQueryRepository {
}

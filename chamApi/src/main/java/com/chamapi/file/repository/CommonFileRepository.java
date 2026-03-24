package com.chamapi.file.repository;

import com.chamapi.file.entity.CommonFile;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommonFileRepository extends JpaRepository<CommonFile, Long> {
}

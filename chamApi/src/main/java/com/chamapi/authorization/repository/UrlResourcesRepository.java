package com.chamapi.authorization.repository;

import org.springframework.core.io.UrlResource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UrlResourcesRepository extends JpaRepository<UrlResource, Long> {
}

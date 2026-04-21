package com.chamapi.authorization.repository;

import com.chamapi.authorization.entity.UrlResources;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UrlResourcesRepository extends JpaRepository<UrlResources, Long> {
}

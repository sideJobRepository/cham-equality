package com.chamapi.appupdate.repository;

import com.chamapi.appupdate.entity.AppBundle;
import com.chamapi.appupdate.repository.query.AppBundleQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AppBundleRepository extends JpaRepository<AppBundle, Long>, AppBundleQueryRepository {
}

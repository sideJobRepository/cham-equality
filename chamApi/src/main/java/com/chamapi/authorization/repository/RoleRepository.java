package com.chamapi.authorization.repository;


import com.chamapi.authorization.entity.Role;
import com.chamapi.authorization.repository.query.RoleQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> , RoleQueryRepository {
}

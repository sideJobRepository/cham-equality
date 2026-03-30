package com.chamapi.role.repository;


import com.chamapi.role.entity.Role;
import com.chamapi.role.repository.query.RoleQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, Long> , RoleQueryRepository {
}

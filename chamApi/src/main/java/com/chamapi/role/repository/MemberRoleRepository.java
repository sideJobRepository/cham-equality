package com.chamapi.role.repository;

import com.chamapi.role.entity.MemberRole;
import com.chamapi.role.repository.query.MemberRoleQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRoleRepository extends JpaRepository<MemberRole, Long>, MemberRoleQueryRepository {


}

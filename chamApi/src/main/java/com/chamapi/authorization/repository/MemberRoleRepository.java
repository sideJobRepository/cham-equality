package com.chamapi.authorization.repository;

import com.chamapi.authorization.entity.MemberRole;
import com.chamapi.authorization.repository.query.MemberRoleQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRoleRepository extends JpaRepository<MemberRole, Long>, MemberRoleQueryRepository {


}

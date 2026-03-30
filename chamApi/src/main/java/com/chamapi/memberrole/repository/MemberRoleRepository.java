package com.chamapi.memberrole.repository;

import com.chamapi.memberrole.entity.MemberRole;
import com.chamapi.memberrole.repository.query.MemberRoleQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRoleRepository extends JpaRepository<MemberRole, Long>, MemberRoleQueryRepository {


}

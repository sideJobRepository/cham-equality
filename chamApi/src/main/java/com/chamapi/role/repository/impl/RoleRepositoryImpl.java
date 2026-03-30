package com.chamapi.role.repository.impl;

import com.chamapi.role.entity.QRole;
import com.chamapi.role.entity.Role;
import com.chamapi.role.repository.query.RoleQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import static com.chamapi.role.entity.QRole.*;


@RequiredArgsConstructor
public class RoleRepositoryImpl implements RoleQueryRepository {
    
    private final JPAQueryFactory queryFactory;
    
    @Override
    public Role findByRoleName(String roleName) {
        return queryFactory
                .select(role)
                .from(role)
                .where(role.roleName.eq(roleName))
                .fetchFirst();
    }
}

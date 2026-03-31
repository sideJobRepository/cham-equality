package com.chamapi.authorization.repository.impl;

import com.chamapi.authorization.entity.QRole;
import com.chamapi.authorization.entity.Role;
import com.chamapi.authorization.repository.query.RoleQueryRepository;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;

import static com.chamapi.authorization.entity.QRole.*;


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

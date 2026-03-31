package com.chamapi.security.service.impl;


import com.chamapi.security.dto.response.RoleMapResponse;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.chamapi.authorization.entity.QUrlResources.urlResources;
import static com.chamapi.authorization.entity.QRole.role;
import static com.chamapi.authorization.entity.QUrlResourcesRole.urlResourcesRole;


@Service
@Transactional(readOnly = true)
public class UrlRoleMappingServiceImpl {
    
    private LinkedHashMap<String, String> urlRoleMappings = new LinkedHashMap<>();
    private final JPAQueryFactory queryFactory;
    
    public UrlRoleMappingServiceImpl(JPAQueryFactory queryFactory) {
        this.queryFactory = queryFactory;
    }
    
    public Map<String,String> getRoleMappings() {
        urlRoleMappings.clear();
        List<RoleMapResponse> resourcesList = queryFactory
                .select(Projections.constructor(
                        RoleMapResponse.class,
                        urlResources.urlResourcesPath,
                        role.roleName,
                        urlResources.urlHttpMethod
                ))
                .from(urlResourcesRole)
                .join(urlResourcesRole.urlResources, urlResources)
                .join(urlResourcesRole.role, role)
                .fetch();

        resourcesList
                .forEach(resources -> {
                    String key = resources.getHttpMethod().toUpperCase() + " " + resources.getUResourcesPath(); // "POST /api/notice"
                    urlRoleMappings.put(key, "ROLE_" + resources.getRoleName());
                });
        return urlRoleMappings;
    }
}

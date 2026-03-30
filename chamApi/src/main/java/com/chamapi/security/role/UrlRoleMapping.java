package com.chamapi.security.role;


import com.chamapi.security.role.response.RoleMapResponse;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQueryFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.chamapi.resources.entity.QUrlResources.urlResources;
import static com.chamapi.resourcesrole.entity.QUrlResourcesRole.urlResourcesRole;
import static com.chamapi.role.entity.QRole.role;


@Service
@Transactional(readOnly = true)
public class UrlRoleMapping {
    
    private LinkedHashMap<String, String> urlRoleMappings = new LinkedHashMap<>();
    private final JPAQueryFactory queryFactory;
    
    public UrlRoleMapping(JPAQueryFactory queryFactory) {
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
                    String key = resources.getHttpMethod().toUpperCase() + " " + resources.getBgmAgitUrlResourcesPath(); // "POST /bgm-agit/notice"
                    urlRoleMappings.put(key, "ROLE_" + resources.getBgmAgitRoleName());
                });
        return urlRoleMappings;
    }
}

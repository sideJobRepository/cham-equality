package com.chamapi.security.role;


import com.chamapi.hierarchy.service.RoleHierarchyService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

@Configuration
public class RoleConfig {

    
    @Bean
    public RoleHierarchyImpl roleHierarchy(RoleHierarchyService bgmAgitRoleHierarchyService) {
        return RoleHierarchyImpl.fromHierarchy(bgmAgitRoleHierarchyService.findAllHierarchy());
    }
}

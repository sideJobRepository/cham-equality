package com.chamapi.security.config;


import com.chamapi.role.service.RoleHierarchyService;
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

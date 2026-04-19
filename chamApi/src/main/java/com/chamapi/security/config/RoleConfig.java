package com.chamapi.security.config;


import com.chamapi.authorization.service.RoleHierarchyService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

@Configuration
public class RoleConfig {

    @Bean
    public RoleHierarchyImpl roleHierarchy(RoleHierarchyService roleHierarchyService) {
        return RoleHierarchyImpl.fromHierarchy(roleHierarchyService.findAllHierarchy());
    }
}

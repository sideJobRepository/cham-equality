package com.chamapi.security.service;


import com.chamapi.security.role.UrlRoleMapping;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;


@Service
@RequiredArgsConstructor
public class DynamicAuthorizationServiceImpl {
    
    
    private final UrlRoleMapping urlRoleMapping;
    
    
    @Transactional(readOnly = true)
    public Map<String, String> getUrlRoleMappings() {
        return urlRoleMapping.getRoleMappings();
    }
}

package com.chamapi.role.service.impl;

import com.chamapi.role.entity.RoleHierarchy;
import com.chamapi.role.repository.RoleHierarchyRepository;
import com.chamapi.role.service.RoleHierarchyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class RoleHierarchyServiceImpl implements RoleHierarchyService {
    
    private final RoleHierarchyRepository roleHierarchyRepository;
    
    @Override
    @Transactional(readOnly = true)
    public String findAllHierarchy() {
        
        List<RoleHierarchy> roleHierarchiesList = roleHierarchyRepository.findAll();
        StringBuilder hierarchy = new StringBuilder();
        
        for (RoleHierarchy relation : roleHierarchiesList) {
            RoleHierarchy parent = relation.getParent();
            if (parent == null) continue; // 부모가 없으면 스킵
            hierarchy.append("ROLE_")
                    .append(relation.getParent() != null ? relation.getParent().getRoleName() : relation.getRoleName())
                    .append(" > ROLE_")
                    .append(relation.getRoleName())
                    .append("\n");
        }
        
        return hierarchy.toString();
    }
}

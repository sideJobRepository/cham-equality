package com.chamapi.role.repository.query;


import com.chamapi.role.entity.Role;

public interface RoleQueryRepository  {
    Role findByRoleName(String role);
}

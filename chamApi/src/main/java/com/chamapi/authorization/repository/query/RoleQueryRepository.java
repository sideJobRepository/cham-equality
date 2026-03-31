package com.chamapi.authorization.repository.query;


import com.chamapi.authorization.entity.Role;

public interface RoleQueryRepository  {
    Role findByRoleName(String role);
}

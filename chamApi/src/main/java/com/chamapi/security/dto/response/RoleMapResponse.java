package com.chamapi.security.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleMapResponse {
    
    private String uResourcesPath;
    private String roleName;
    private String httpMethod;
}

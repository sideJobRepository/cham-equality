package com.chamapi.security.role.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleMapResponse {
    
    private String bgmAgitUrlResourcesPath;
    private String bgmAgitRoleName;
    private String httpMethod;
}

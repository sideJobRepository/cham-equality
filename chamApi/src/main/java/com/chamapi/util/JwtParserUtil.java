package com.chamapi.util;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.List;
import java.util.Optional;

public class JwtParserUtil {

    public static Long extractMemberId(Jwt jwt) {
        return Optional.ofNullable(jwt)
                .map(token -> token.getClaim("id"))
                .map(Object::toString)
                .map(Long::valueOf)
                .orElse(null);
    }
    
    public static String extractRole(Jwt jwt) {
         List<String> roles = jwt.getClaim("roles");
        return roles != null && !roles.isEmpty() ? roles.get(0) : "GUEST";
    }

    public static List<String> extractRoles(Jwt jwt) {
        if (jwt == null) return List.of();
        List<String> roles = jwt.getClaim("roles");
        return roles != null ? roles : List.of();
    }
}

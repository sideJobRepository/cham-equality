package com.chamapi.security.manager;


import com.chamapi.security.service.impl.DynamicAuthorizationServiceImpl;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;
import org.springframework.security.authorization.AuthorityAuthorizationManager;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.authorization.AuthorizationResult;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.access.expression.DefaultHttpSecurityExpressionHandler;
import org.springframework.security.web.access.expression.WebExpressionAuthorizationManager;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.util.matcher.RequestMatcher;
import org.springframework.security.web.util.matcher.RequestMatcherEntry;
import org.springframework.stereotype.Service;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@RequiredArgsConstructor
@Service("chamEqualityAuthorizationManager")
public class ChamEqualityAuthorizationManager implements AuthorizationManager<RequestAuthorizationContext> {
    
    private static final AuthorizationResult ACCESS = new AuthorizationDecision(true);
    
    private List<RequestMatcherEntry<AuthorizationManager<RequestAuthorizationContext>>> mappings;
    
    private final RoleHierarchyImpl roleHierarchy;
    private final DynamicAuthorizationServiceImpl dynamicAuthorizationService;
    
    @PostConstruct
    public void init() {
        reload();
    }
    
    /**
     * 권한 매핑 재로딩
     */
    public synchronized void reload() {
        Map<String, String> urlRoleMappings = dynamicAuthorizationService.getUrlRoleMappings();
        
        this.mappings = urlRoleMappings.entrySet()
                .stream()
                .map(this::createMapping)
                .toList();
    }
    
    /**
     * "GET /api/test" → RequestMatcherEntry 생성
     */
    private RequestMatcherEntry<AuthorizationManager<RequestAuthorizationContext>> createMapping(
            Map.Entry<String, String> entry
    ) {
        String[] parts = entry.getKey().split(" ", 2);
        
        String method = parts[0];
        String path = parts[1];
        
        PathPatternRequestMatcher matcher = PathPatternRequestMatcher.withDefaults().matcher(HttpMethod.valueOf(method), path);
        
        return new RequestMatcherEntry<>(matcher, createAuthorizationManager(entry.getValue()));
    }
    
    /**
     * role or expression 기반 AuthorizationManager 생성
     */
    private AuthorizationManager<RequestAuthorizationContext> createAuthorizationManager(String roleOrExpression) {
        
        // null이면 그냥 허용
        if (roleOrExpression == null) {
            return (auth, ctx) -> ACCESS;
        }
        
        // ROLE 기반
        if (roleOrExpression.startsWith("ROLE")) {
            AuthorityAuthorizationManager<RequestAuthorizationContext> manager =
                    AuthorityAuthorizationManager.hasAnyAuthority(roleOrExpression);
            manager.setRoleHierarchy(roleHierarchy);
            return manager;
        }
        //시큐리티 7.0 부터는 바뀐다는데 나중에바꾸자..
        DefaultHttpSecurityExpressionHandler handler = new DefaultHttpSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        
        WebExpressionAuthorizationManager manager =
                new WebExpressionAuthorizationManager(roleOrExpression);
        manager.setExpressionHandler(handler);
        
        return manager;
    }
    
    /**
     * 핵심: Spring Security 6.4+ 방식
     */
    @Override
    public AuthorizationResult authorize(
            Supplier<? extends Authentication> authentication,
            RequestAuthorizationContext context
    ) {
        
        HttpServletRequest request = context.getRequest();
        
        for (RequestMatcherEntry<AuthorizationManager<RequestAuthorizationContext>> mapping : mappings) {
            
            RequestMatcher matcher = mapping.getRequestMatcher();
            RequestMatcher.MatchResult result = matcher.matcher(request);
            
            if (!result.isMatch()) {
                continue;
            }
            
            AuthorizationManager<RequestAuthorizationContext> manager = mapping.getEntry();
            
            return manager.authorize(
                    authentication,
                    new RequestAuthorizationContext(request, result.getVariables())
            );
        }
        
        // 매칭 없으면 허용 (기존 정책 유지)
        return ACCESS;
    }
}
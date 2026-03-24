package com.chamapi.log;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.stereotype.Component;


@Aspect
@Component
public class JpaRepositoryMethodInterceptor {
    
    @Pointcut("execution(* com.chamapi..*.*(..))")
    public void jpaRepositoryMethods() {}
    
    @Before("jpaRepositoryMethods()")
    public void beforeQuery(JoinPoint joinPoint) {
        String methodSignature = joinPoint.getSignature().toShortString();
        JpaQueryContextHolder.set(methodSignature);
    }
    
    @After("jpaRepositoryMethods()")
    public void afterQuery() {
        JpaQueryContextHolder.clear();
    }
}
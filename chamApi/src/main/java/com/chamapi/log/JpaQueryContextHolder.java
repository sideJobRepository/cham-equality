package com.chamapi.log;

public class JpaQueryContextHolder {
    private static final ThreadLocal<String> contextHolder = new ThreadLocal<>();
    
    public static void set(String context) {
        contextHolder.set(context);
    }
    
    public static String get() {
        return contextHolder.get();
    }
    
    public static void clear() {
        contextHolder.remove();
    }
}

package com.chamapi.security.jwt;

import java.security.SecureRandom;
import java.util.Base64;

public class JwtKeyGenerator {
    public static void main(String[] args) {
        byte[] keyBytes = new byte[32]; // 256비트
        new SecureRandom().nextBytes(keyBytes);
        String secretKey = Base64.getEncoder().encodeToString(keyBytes);
        System.out.println("Secret Key: " + secretKey);
    }
}

package com.chamapi.security.pem;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;

public class PemKey {
    
    public  static RSAPrivateKey loadPrivateKey(String pem) throws Exception {
        String privateKeyPem = pem
                .replace("-----BEGIN PRIVATE KEY-----", "")
                .replace("-----END PRIVATE KEY-----", "")
                .replaceAll("\\r", "")  // CR 제거
                .replaceAll("\\n", "")  // LF 제거
                .replaceAll("\\s", ""); // 기타 공백 제거
        byte[] decoded = Base64.getDecoder().decode(privateKeyPem);
        PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(decoded);
        return (RSAPrivateKey) KeyFactory.getInstance("RSA").generatePrivate(spec);
    }
    
    public  static RSAPublicKey loadPublicKey(InputStream inputStream) throws Exception {
        String key = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        
        String publicKeyPem = key
                .replace("-----BEGIN PUBLIC KEY-----", "")
                .replace("-----END PUBLIC KEY-----", "")
                .replaceAll("\\s+", ""); // 줄바꿈, 탭 등 모두 제거
        
        byte[] decoded = Base64.getDecoder().decode(publicKeyPem);
        X509EncodedKeySpec spec = new X509EncodedKeySpec(decoded);
        return (RSAPublicKey) KeyFactory.getInstance("RSA").generatePublic(spec);
    }
}

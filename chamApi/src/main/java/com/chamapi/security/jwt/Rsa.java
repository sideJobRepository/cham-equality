package com.chamapi.security.jwt;

import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "RSA")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Rsa extends DateSuperClass {
    
    
    @Id
    @GeneratedValue(strategy = IDENTITY)
    @Column(name = "RSA_ID")
    private Long id;
    
    @Column(name = "RSA_PRIVATE_KEY")
    private String rsaPrivateKey;
}

package com.chamapi.role.entity;

import com.chamapi.mapperd.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "ROLE")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Role extends DateSuperClass {

    
    @Id
    @Column(name = "ROLE_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;
    
    @Column(name = "ROLE_NAME")
    private String roleName;
    
}

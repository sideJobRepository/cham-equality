package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "SHELTER_IMAGE")
@Entity
@Getter
@IdClass(ShelterImageId.class)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ShelterImage extends DateSuperClass {

    // 대피소 사진 ID
    @Id
    @Column(name = "SHELTER_IMAGE_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 파일 ID
    @Id
    @Column(name = "FILE_ID")
    private Long fileId;

    // 대피소 사진 설명. 간단 설명. 출입구, 계단 등
    @Column(name = "SHELTER_IMAGE_DESCRIPTION")
    private String shelterImageDescription;
}

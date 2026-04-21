package com.chamapi.shelter.entity;

import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.shelter.enums.ShelterImageCategory;
import jakarta.persistence.*;
import lombok.*;

import static jakarta.persistence.GenerationType.IDENTITY;

@Table(name = "SHELTER_IMAGE")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ShelterImage extends DateSuperClass {

    // 대피소 사진 ID
    @Id
    @Column(name = "SHELTER_IMAGE_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    // 대피소 ID
    @Column(name = "SHELTER_ID")
    private Long shelterId;

    // 파일 ID
    @Column(name = "FILE_ID")
    private Long fileId;

    // 이미지 카테고리
    @Enumerated(EnumType.STRING)
    @Column(name = "SHELTER_IMAGE_CATEGORY")
    private ShelterImageCategory category;

    // 대피소 사진 설명. 간단 설명. 출입구, 계단 등
    @Column(name = "SHELTER_IMAGE_DESCRIPTION")
    private String imageDescription;
}

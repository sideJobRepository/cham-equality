package com.chamapi.content.entity;


import com.chamapi.common.entity.DateSuperClass;
import com.chamapi.content.enums.ContentType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

import static jakarta.persistence.GenerationType.*;

@Table(name = "CONTENT")
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Content extends DateSuperClass {

    @Id
    @Column(name = "CONTENT_ID")
    @GeneratedValue(strategy = IDENTITY)
    private Long id;

    @Column(name = "CONTENT_TYPE")
    @Enumerated(EnumType.STRING)
    private ContentType contentType;

    @Column(name = "NAME", nullable = false, length = 500)
    private String name;

    @Column(name = "IMAGE_FILE_ID", columnDefinition = "TEXT")
    private Long imageFileId;

    @Column(name = "URL", columnDefinition = "TEXT")
    private String url;

    @Column(name = "ADDITIONAL_INFO", columnDefinition = "TEXT")
    private String additionalInfo;

    @Column(name = "DISPLAY_START_DATE")
    private LocalDateTime displayStartDate;

    @Column(name = "DISPLAY_END_DATE")
    private LocalDateTime displayEndDate;

}

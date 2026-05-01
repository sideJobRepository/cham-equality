package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.ShelterImage;
import com.chamapi.shelter.enums.ShelterImageCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ShelterImageRepository extends JpaRepository<ShelterImage, Long> {

    List<ShelterImage> findAllByFileIdIn(Collection<Long> fileIds);

    List<ShelterImage> findAllByShelterIdAndCategoryOrderByIdAsc(Long shelterId, ShelterImageCategory category);

    void deleteAllByFileIdIn(Collection<Long> fileIds);
}

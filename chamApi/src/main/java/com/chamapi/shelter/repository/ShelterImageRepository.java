package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.ShelterImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface ShelterImageRepository extends JpaRepository<ShelterImage, Long> {

    List<ShelterImage> findAllByShelterId(Long shelterId);

    List<ShelterImage> findAllByFileIdIn(Collection<Long> fileIds);

    void deleteAllByFileIdIn(Collection<Long> fileIds);
}

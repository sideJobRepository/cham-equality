package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.Place;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlaceRepository extends JpaRepository<Place, Long> {
}

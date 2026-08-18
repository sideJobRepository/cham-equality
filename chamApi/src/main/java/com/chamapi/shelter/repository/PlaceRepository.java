package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.Place;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlaceRepository extends JpaRepository<Place, Long> {

    Optional<Place> findFirstByAddressOrderByIdAsc(String address);
}

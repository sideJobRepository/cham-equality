package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.Place;
import com.chamapi.shelter.repository.query.PlaceQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PlaceRepository extends JpaRepository<Place, Long>, PlaceQueryRepository {

    Optional<Place> findFirstByAddressOrderByIdAsc(String address);
}

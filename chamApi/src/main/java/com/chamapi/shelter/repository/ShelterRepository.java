package com.chamapi.shelter.repository;

import com.chamapi.shelter.entity.Shelter;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShelterRepository extends JpaRepository<Shelter, Long> {
}

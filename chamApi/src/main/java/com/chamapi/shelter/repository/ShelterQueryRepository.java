package com.chamapi.shelter.repository;

import com.chamapi.shelter.dto.query.ShelterSearchCondition;
import com.chamapi.shelter.entity.Shelter;

import java.util.List;

public interface ShelterQueryRepository {

    List<Shelter> searchByCondition(ShelterSearchCondition condition);

}

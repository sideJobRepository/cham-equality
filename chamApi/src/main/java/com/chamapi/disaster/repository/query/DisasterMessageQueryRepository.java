package com.chamapi.disaster.repository.query;

import com.chamapi.disaster.entity.DisasterMessage;

import java.util.List;
import java.util.Set;

public interface DisasterMessageQueryRepository {

    Set<Long> findExistingSns(List<Long> sns);

    List<DisasterMessage> findLatest(String region, int limit);
}

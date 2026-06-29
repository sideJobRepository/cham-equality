package com.chamapi.geocode.service;

import com.chamapi.shelter.entity.Place;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.Rollback;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@SpringBootTest
class GeocodingServiceTest {

    @Autowired
    GeocodingService geocodingService;

    @PersistenceContext
    EntityManager em;

    @Test
    void test(){
        String s = geocodingService.convertToEnglishAddress("대전광역시 동구 가양동 426-4");
        System.out.println(s);
    }

    /**
     * 영문주소 밀어넣기. 필요할때만 사용
     */
    // @Test
    @Transactional
    @Rollback(false)
    void place(){
        List<Place> places = em.createQuery("select p from Place p where p.englishAddress is null", Place.class)
                .getResultList();

        for (Place place : places) {
            try{
                String englishAddress = geocodingService.convertToEnglishAddress(place.getAddress());
                place.setEnglishAddress(englishAddress);
                em.merge(place);
            }catch (Exception e){
                System.out.println(e.getMessage());
            }
        }

        em.flush();
    }
}

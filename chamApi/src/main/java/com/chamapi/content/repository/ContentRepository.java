package com.chamapi.content.repository;

import com.chamapi.content.entity.Content;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ContentRepository extends JpaRepository<Content, Long> {

    @Query("select c from Content c where c.displayStartDate <= :date and c.displayEndDate >= :date")
    List<Content> findDisplayableAt(LocalDateTime date);

}

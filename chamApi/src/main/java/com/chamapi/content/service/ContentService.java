package com.chamapi.content.service;

import com.chamapi.content.entity.Content;
import com.chamapi.content.repository.ContentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;

    public List<Content> getAllDisplayableContents(){
        return contentRepository.findDisplayableAt(LocalDateTime.now());
    }

}

package com.chamapi.admin.service;

import com.chamapi.admin.dto.request.AdminContentCreateRequest;
import com.chamapi.admin.dto.request.AdminContentUpdateRequest;
import com.chamapi.content.entity.Content;
import com.chamapi.content.repository.ContentRepository;
import com.chamapi.file.service.S3FileService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminContentService {

    private final ContentRepository contentRepository;
    private final S3FileService fileService;

    public List<Content> getAllContents(){
        return contentRepository.findAll();
    }

    @Transactional
    public void createContent(AdminContentCreateRequest request){
        Content content = contentRepository.save(Content.builder()
                .contentType(request.contentType())
                .name(request.name())
                .imageFileId(request.imageFileId())
                .url(request.url())
                .additionalInfo(request.additionalInfo())
                .displayStartDate(request.displayStartDate())
                .displayEndDate(request.displayEndDate())
                .build());

        completeImageFile(content.getId(), content.getImageFileId());
    }

    @Transactional
    public void updateContent(Long id, AdminContentUpdateRequest request){
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Content를 찾을 수 없습니다. id = " + id));

        content.update(
                request.name(),
                request.imageFileId(),
                request.url(),
                request.additionalInfo(),
                request.displayStartDate(),
                request.displayEndDate()
        );

        contentRepository.save(content);

        completeImageFile(id, content.getImageFileId());
    }

    @Transactional
    public void removeContent(Long id){
       contentRepository.deleteById(id);
    }

    private void completeImageFile(Long contentId, Long imageFileId){
        if(imageFileId == null)
            return;

        fileService.markComplete(imageFileId, contentId);
    }
}

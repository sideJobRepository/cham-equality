package com.chamapi.file.service;

import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.repository.CommonFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class FileBatchService {

    private final CommonFileRepository commonFileRepository;
    
    private final S3Client s3Client;

    
    public void temporaryFileRemove(LocalDateTime targetTime,String bucket) {
         List<CommonFile> files = commonFileRepository.findTemporaryFilesBefore(targetTime);
        for (CommonFile file : files) {
                  DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                          .bucket(bucket)
                          .key(file.getFilePath())
                          .build();
                  s3Client.deleteObject(deleteObjectRequest);
              }
         commonFileRepository.deleteAll(files);
     }
}

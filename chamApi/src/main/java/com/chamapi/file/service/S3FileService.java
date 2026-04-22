package com.chamapi.file.service;

import com.chamapi.file.dto.request.FileRequest;
import com.chamapi.file.dto.request.FileUploadRequest;
import com.chamapi.file.dto.response.FileUploadResponse;
import com.chamapi.file.dto.response.FileViewResponse;
import com.chamapi.file.dto.response.PresignedUrlResponse;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileProcessStatus;
import com.chamapi.file.enums.FileStatus;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.io.OutputStream;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;


/**
 * S3 업/다운로드와 {@link CommonFile} 생명주기 관리.
 *
 * <p>파일 생명주기:
 * <ol>
 *   <li>{@link #getUploadPresignedUrl}로 PUT URL 발급(5분 유효).</li>
 *   <li>프론트가 S3에 직접 PUT.</li>
 *   <li>{@link #uploadFile}로 DB에 {@code TEMPORARY} 상태 등록(아직 어떤 도메인에 속하지 않은 고아 상태).</li>
 *   <li>도메인 저장 시 {@link #modifyFileStatus}로 targetId를 박고 {@code COMPLETE}로 전환.</li>
 *   <li>{@code TEMPORARY}로 1일 이상 방치된 파일은 {@code CommonFileSchedule}이 01:00에 수거.</li>
 * </ol>
 * 조회용 뷰 URL은 {@link FileViewUrlCache}가 50분 TTL로 캐싱한다(서명 만료와 TTL 동기화).
 */
@Service
@RequiredArgsConstructor
@Transactional
public class S3FileService {


    private final S3Presigner s3Presigner;
    private final S3Client s3Client;
    private final CommonFileRepository commonFileRepository;
    private final FileViewUrlCache fileViewUrlCache;

    @Value("${spring.cloud.aws.s3.bucket}")
    private String bucket;

    /**
     * 업로드용 Presigned PUT URL을 파일별로 발급한다.
     * 객체 키는 {@code UUID.확장자}로 생성해 원본 파일명 충돌/경로 추정을 차단한다.
     */
    public List<PresignedUrlResponse> getUploadPresignedUrl(FileUploadRequest request) {

        return request.getFiles().stream().map(file -> {

            String objectKey = UUID.randomUUID() + "." + FilenameUtils.getExtension(file.getFileName());

            PutObjectRequest objectRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(objectKey)
                    .contentType(file.getContentType())
                    .build();

            PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(5))
                    .putObjectRequest(objectRequest)
                    .build();

            PresignedPutObjectRequest presignedRequest = s3Presigner.presignPutObject(presignRequest);

            return new PresignedUrlResponse(
                    presignedRequest.url().toString(),
                    objectKey,
                    file.getFileName(),
                    bucket,
                    file.getContentType()
            );
        }).toList();
    }

    /**
     * PUT 완료된 파일의 메타데이터를 DB에 등록한다. 상태는 {@code TEMPORARY}로 시작.
     * 이후 도메인(예: 신고)이 생성되면서 {@link #modifyFileStatus}로 targetId가 채워지고
     * {@code COMPLETE}로 승격된다. 승격 없이 방치되면 일일 배치가 수거한다.
     */
    public List<FileUploadResponse> uploadFile(FileUploadRequest request) {
        FileType fileType = request.getFileType();
        return request.getFiles()
                .stream()
                .map(file -> {
                    CommonFile save = CommonFile
                            .builder()
                            .fileName(file.getFileName())
                            .fileSize(file.getFileSize())
                            .fileContentType(file.getContentType())
                            .filePath(file.getObjectKey())
                            .fileType(fileType)
                            .bucketName(file.getBucketName())
                            .fileStatus(FileStatus.TEMPORARY)
                            .build();
                    commonFileRepository.save(save);
                    return FileUploadResponse.from(save);
                }).toList();
    }


    /**
     * 단건 다운로드용 Presigned GET URL 발급(5분 유효).
     * {@code responseContentDisposition}을 서명에 포함시켜 S3 응답에 attachment 헤더가 박히게 한다.
     * 그래서 프론트가 URL을 어떻게 열든 브라우저가 다운로드로 처리한다(새 탭 안 열림, CORS 불필요).
     */
    @Transactional(readOnly = true)
    public String fileDownload(Long id) {
        CommonFile file = commonFileRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("존재 하지 않는 파일 ID 입니다 : " + id));

        GetObjectRequest getObjectRequest = GetObjectRequest.builder().bucket(bucket)
                .key(file.getFilePath())
                .responseContentDisposition(buildContentDisposition(file.getFileName())).build();

        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder().signatureDuration(Duration.ofMinutes(5)).getObjectRequest(getObjectRequest).build();

        PresignedGetObjectRequest presignedGetObjectRequest = s3Presigner.presignGetObject(presignRequest);

        return presignedGetObjectRequest.url().toString();
    }

    /**
     * 한글 파일명을 RFC 5987 형식으로 내려보내기 위한 헤더 값 생성.
     * 구형 브라우저용 ASCII 대체명과 UTF-8 퍼센트 인코딩을 모두 실어 호환성을 확보한다.
     */
    private String buildContentDisposition(String fileName) {
        String asciiFallback = fileName.replaceAll("[^\\x20-\\x7E]", "_").replace("\"", "'");
        String utf8Encoded = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");
        return "attachment; filename=\"" + asciiFallback + "\"; filename*=UTF-8''" + utf8Encoded;
    }

    /**
     * 다건 ZIP 다운로드. 서버가 S3에서 파일별 {@link ResponseInputStream}을 열어
     * 즉시 {@link ZipOutputStream}으로 흘려보내는 방식이라 서버 메모리에 Blob을 쌓지 않는다.
     * 파일명 중복은 {@link #disambiguateName}으로 {@code 사진-2.jpg} 식으로 회피한다.
     */
    @Transactional(readOnly = true)
    public void downloadFilesAsZip(List<Long> ids, String zipFileName, HttpServletResponse response) throws IOException {
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("파일 ID가 필요합니다");
        }
        List<CommonFile> files = commonFileRepository.findFilesIds(ids);
        if (files.isEmpty()) {
            throw new IllegalArgumentException("다운로드할 파일을 찾을 수 없습니다");
        }

        response.setContentType("application/zip");
        response.setHeader("Content-Disposition", buildContentDisposition(zipFileName));

        Set<String> taken = new HashSet<>();
        try (OutputStream out = response.getOutputStream();
             ZipOutputStream zos = new ZipOutputStream(out)) {
            for (CommonFile file : files) {
                String entryName = disambiguateName(taken, file.getFileName());
                zos.putNextEntry(new ZipEntry(entryName));
                try (ResponseInputStream<GetObjectResponse> s3stream = s3Client.getObject(
                        GetObjectRequest.builder().bucket(bucket).key(file.getFilePath()).build())) {
                    s3stream.transferTo(zos);
                }
                zos.closeEntry();
            }
            zos.finish();
        }
    }

    /** ZIP 엔트리명 중복 회피. {@code taken}에 이미 있으면 {@code name-2.ext}, {@code name-3.ext} 순으로 증가. */
    private String disambiguateName(Set<String> taken, String name) {
        if (taken.add(name)) return name;
        int dot = name.lastIndexOf('.');
        String base = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        int n = 2;
        while (!taken.add(base + "-" + n + ext)) n++;
        return base + "-" + n + ext;
    }

    /**
     * 도메인 저장/수정 시 첨부 파일들의 상태를 일괄 전환.
     * CREATE: {@code TEMPORARY → COMPLETE} + targetId 세팅(도메인 ID와 파일을 묶음).
     * DELETE: {@code COMPLETE → TEMPORARY}로 되돌려 일일 배치가 S3/DB에서 수거하게 맡김(즉시 삭제 X).
     */
    public void modifyFileStatus(FileRequest request,Long targetId) {
        List<FileRequest.FileChangeRequest> files = request.getFiles();
        if(files.isEmpty()) {
            return;
        }
        List<Long> createFileIds = files.stream().filter(item -> item.getFileProcessStatus() == FileProcessStatus.CREATE)
                .map(FileRequest.FileChangeRequest::getId)
                .toList();

        List<Long> deleteFileIds = files.stream().filter(item -> item.getFileProcessStatus() == FileProcessStatus.DELETE)
                .map(FileRequest.FileChangeRequest::getId)
                .toList();

        List<CommonFile> createFile = commonFileRepository.findFilesIds(createFileIds);
        createFile.forEach(item -> item.createTargetIdAndModifyCompleteFileStatus(targetId));

        List<CommonFile> deleteFile = commonFileRepository.findFilesIds(deleteFileIds);
        deleteFile.forEach(CommonFile::modifyTemporaryFileStatus);
    }

    /** 조회용 Presigned GET URL을 50분 TTL 캐시로 일괄 반환. 요청된 id 순서를 유지한다. */
    public List<FileViewResponse> getFilesForView(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }

        return ids.stream()
                .map(fileViewUrlCache::getFileUrl)
                .toList();
    }
    
}

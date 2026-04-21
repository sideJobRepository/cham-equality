package com.chamapi.shelter.service;

import com.chamapi.common.dto.PageResponse;
import com.chamapi.file.dto.response.FileViewResponse;
import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.enums.FileType;
import com.chamapi.file.repository.CommonFileRepository;
import com.chamapi.file.service.S3FileService;
import com.chamapi.shelter.dto.request.ShelterInfoReportCreateRequest;
import com.chamapi.shelter.dto.response.ShelterReportDetailResponse;
import com.chamapi.shelter.dto.response.ShelterReportListResponse;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterImage;
import com.chamapi.shelter.entity.ShelterInfoReport;
import com.chamapi.shelter.enums.ShelterInfoReportStatus;
import com.chamapi.shelter.repository.ShelterImageRepository;
import com.chamapi.shelter.repository.ShelterInfoReportRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShelterInfoReportService {

    private final ShelterInfoReportRepository shelterInfoReportRepository;
    private final ShelterImageRepository shelterImageRepository;
    private final CommonFileRepository commonFileRepository;
    private final ShelterRepository shelterRepository;
    private final S3FileService s3FileService;

    @Transactional
    public Long createReport(ShelterInfoReportCreateRequest request) {
        ShelterInfoReport saved = shelterInfoReportRepository.save(request.toEntity());

        List<ShelterInfoReportCreateRequest.ImageItem> images = request.images();
        if (images != null && !images.isEmpty()) {
            attachImages(request.shelterId(), saved.getId(), images);
        }

        return saved.getId();
    }

    public PageResponse<ShelterReportListResponse> findReports(ShelterInfoReportStatus status, Pageable pageable) {
        var page = (status == null)
                ? shelterInfoReportRepository.findAll(pageable)
                : shelterInfoReportRepository.findAllByRequestStatus(status, pageable);
        return PageResponse.from(page.map(ShelterReportListResponse::from));
    }

    public ShelterReportDetailResponse getReportDetail(Long reportId) {
        ShelterInfoReport report = shelterInfoReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리포트 ID: " + reportId));

        Shelter shelter = shelterRepository.findById(report.getShelterId()).orElse(null);

        List<CommonFile> files = commonFileRepository.findByTargetIdAndFileType(reportId, FileType.SHELTER_IMAGE);
        List<Long> fileIds = files.stream().map(CommonFile::getId).toList();

        Map<Long, ShelterImage> imageByFileId = fileIds.isEmpty()
                ? Map.of()
                : shelterImageRepository.findAllByFileIdIn(fileIds).stream()
                        .collect(Collectors.toMap(ShelterImage::getFileId, Function.identity(), (a, b) -> a));

        List<FileViewResponse> views = s3FileService.getFilesForView(fileIds);

        List<ShelterReportDetailResponse.ImageView> imageViews = views.stream()
                .map(view -> {
                    ShelterImage img = imageByFileId.get(view.getFileId());
                    return new ShelterReportDetailResponse.ImageView(
                            view.getFileId(),
                            img != null ? img.getCategory() : null,
                            img != null ? img.getImageDescription() : null,
                            view.getUrl(),
                            view.getFileName()
                    );
                })
                .toList();

        return ShelterReportDetailResponse.of(report, shelter, imageViews);
    }

    @Transactional
    public void approve(Long reportId) {
        ShelterInfoReport report = shelterInfoReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리포트 ID: " + reportId));

        Shelter shelter = shelterRepository.findById(report.getShelterId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 대피소 ID: " + report.getShelterId()));

        shelter.applyReport(report);
        report.approve();
    }

    @Transactional
    public void reject(Long reportId) {
        ShelterInfoReport report = shelterInfoReportRepository.findById(reportId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 리포트 ID: " + reportId));
        report.reject();

        List<CommonFile> files = commonFileRepository.findByTargetIdAndFileType(reportId, FileType.SHELTER_IMAGE);
        if (files.isEmpty()) return;

        List<Long> fileIds = files.stream().map(CommonFile::getId).toList();
        shelterImageRepository.deleteAllByFileIdIn(fileIds);
        files.forEach(CommonFile::modifyTemporaryFileStatus);
    }

    private void attachImages(Long shelterId, Long reportId, List<ShelterInfoReportCreateRequest.ImageItem> images) {
        List<Long> fileIds = images.stream()
                .map(ShelterInfoReportCreateRequest.ImageItem::fileId)
                .toList();

        Map<Long, CommonFile> filesById = commonFileRepository.findFilesIds(fileIds).stream()
                .collect(Collectors.toMap(CommonFile::getId, Function.identity()));

        List<ShelterImage> rows = images.stream()
                .filter(item -> filesById.containsKey(item.fileId()))
                .map(item -> {
                    CommonFile file = filesById.get(item.fileId());
                    file.createTargetIdAndModifyCompleteFileStatus(reportId);
                    return ShelterImage.builder()
                            .shelterId(shelterId)
                            .fileId(item.fileId())
                            .category(item.category())
                            .imageDescription(item.description())
                            .build();
                })
                .toList();

        shelterImageRepository.saveAll(rows);
    }
}

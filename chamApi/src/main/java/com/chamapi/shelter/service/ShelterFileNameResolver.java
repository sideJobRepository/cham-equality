package com.chamapi.shelter.service;

import com.chamapi.file.entity.CommonFile;
import com.chamapi.file.repository.CommonFileRepository;
import com.chamapi.file.service.FileNameResolver;
import com.chamapi.shelter.entity.Shelter;
import com.chamapi.shelter.entity.ShelterImage;
import com.chamapi.shelter.enums.ShelterImageCategory;
import com.chamapi.shelter.repository.ShelterImageRepository;
import com.chamapi.shelter.repository.ShelterRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.io.FilenameUtils;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 대피소 첨부 사진의 다운로드 파일명을 {@code 시설명_카테고리한글_n.확장자} 형식으로 재작성한다.
 * 같은 (대피소, 카테고리) 쌍 안에서의 인덱스는 ShelterImage id 오름차순으로 1부터 매긴다.
 */
@Component
@RequiredArgsConstructor
public class ShelterFileNameResolver implements FileNameResolver {

    private static final Map<ShelterImageCategory, String> CATEGORY_KO = buildCategoryKoMap();

    private final ShelterImageRepository shelterImageRepository;
    private final ShelterRepository shelterRepository;
    private final CommonFileRepository commonFileRepository;

    @Override
    public Map<Long, String> resolveOverrideNames(Collection<Long> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) return Map.of();

        List<ShelterImage> images = shelterImageRepository.findAllByFileIdIn(fileIds);
        if (images.isEmpty()) return Map.of();

        Map<Long, CommonFile> filesById = commonFileRepository.findFilesIds(
                images.stream().map(ShelterImage::getFileId).toList()
        ).stream().collect(Collectors.toMap(CommonFile::getId, Function.identity()));

        Set<Long> shelterIds = images.stream().map(ShelterImage::getShelterId).collect(Collectors.toSet());
        Map<Long, String> shelterNamesById = shelterRepository.findAllById(shelterIds).stream()
                .collect(Collectors.toMap(Shelter::getId, Shelter::getName));

        // (shelterId, category) 그룹별 형제 fileId 목록을 한 번씩만 조회해 인덱스 계산에 재사용한다.
        Map<String, List<Long>> siblingsByKey = new HashMap<>();
        for (ShelterImage img : images) {
            String key = img.getShelterId() + ":" + img.getCategory();
            siblingsByKey.computeIfAbsent(key, k ->
                    shelterImageRepository
                            .findAllByShelterIdAndCategoryOrderByIdAsc(img.getShelterId(), img.getCategory())
                            .stream()
                            .map(ShelterImage::getFileId)
                            .toList()
            );
        }

        Map<Long, String> result = new HashMap<>();
        for (ShelterImage img : images) {
            String key = img.getShelterId() + ":" + img.getCategory();
            List<Long> siblings = siblingsByKey.get(key);
            int index = siblings.indexOf(img.getFileId()) + 1;
            if (index <= 0) continue;

            String shelterName = shelterNamesById.get(img.getShelterId());
            if (shelterName == null) continue;

            String categoryKo = img.getCategory() != null
                    ? CATEGORY_KO.getOrDefault(img.getCategory(), img.getCategory().name())
                    : "기타";

            CommonFile file = filesById.get(img.getFileId());
            String ext = file != null ? FilenameUtils.getExtension(file.getFileName()) : "";
            String suffix = ext == null || ext.isEmpty() ? "" : "." + ext;

            result.put(img.getFileId(), shelterName + "_" + categoryKo + "_" + index + suffix);
        }
        return result;
    }

    private static Map<ShelterImageCategory, String> buildCategoryKoMap() {
        EnumMap<ShelterImageCategory, String> map = new EnumMap<>(ShelterImageCategory.class);
        map.put(ShelterImageCategory.TOILET, "장애인화장실");
        map.put(ShelterImageCategory.RAMP, "경사로");
        map.put(ShelterImageCategory.ELEVATOR, "엘리베이터");
        map.put(ShelterImageCategory.BRAILLE, "점자블록");
        map.put(ShelterImageCategory.ETC, "기타접근성시설");
        map.put(ShelterImageCategory.EXTERIOR, "외관");
        map.put(ShelterImageCategory.INTERIOR, "내부");
        map.put(ShelterImageCategory.ENTRANCE, "출입구");
        map.put(ShelterImageCategory.SIGNAGE, "안내문");
        return map;
    }
}

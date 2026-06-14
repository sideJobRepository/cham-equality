package com.chamapi.multilingual.service.impl;

import com.chamapi.multilingual.dto.MultilingualBundleResponse;
import com.chamapi.multilingual.dto.MultilingualResponse;
import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.entity.Multilingual;
import com.chamapi.multilingual.repository.MultilingualRepository;
import com.chamapi.multilingual.service.MultilingualService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@Transactional(readOnly = true)
public class MultilingualServiceImpl implements MultilingualService {

    private final MultilingualRepository multilingualRepository;
    // 어느 화면을 요청하든 디폴트로 함께 내려주는 하단 탭 라벨의 menu 이름
    private final String tabMenu;

    public MultilingualServiceImpl(MultilingualRepository multilingualRepository, @Value("${multilingual.tab-menu:tab}") String tabMenu) {
        this.multilingualRepository = multilingualRepository;
        this.tabMenu = tabMenu;
    }

    @Override
    public MultilingualResponse getTexts(String menu, Language language) {
        Map<String, String> texts = toTextMap(multilingualRepository.search(menu, language));
        Map<String, String> tab = menu.equals(tabMenu)
                ? texts
                : toTextMap(multilingualRepository.search(tabMenu, language));

        return new MultilingualResponse(menu, language.getCode(), tab, texts);
    }

    @Override
    public MultilingualBundleResponse getAllTexts(String menu) {
        Map<String, Map<String, String>> texts = toBundleMap(multilingualRepository.search(menu, null));
        Map<String, Map<String, String>> tab = menu.equals(tabMenu)
                ? texts
                : toBundleMap(multilingualRepository.search(tabMenu, null));

        return new MultilingualBundleResponse(menu, tab, texts);
    }

    private Map<String, String> toTextMap(List<Multilingual> rows) {
        Map<String, String> texts = new LinkedHashMap<>();
        for (Multilingual row : rows) {
            texts.put(row.getName(), row.getCont());
        }
        return texts;
    }

    private Map<String, Map<String, String>> toBundleMap(List<Multilingual> rows) {
        Map<String, Map<String, String>> texts = new LinkedHashMap<>();
        for (Multilingual row : rows) {
            String code = row.getLanguage().getCode();
            texts.computeIfAbsent(code, key -> new LinkedHashMap<>())
                    .put(row.getName(), row.getCont());
        }
        return texts;
    }

}

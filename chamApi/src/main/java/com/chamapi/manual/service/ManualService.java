package com.chamapi.manual.service;

import com.chamapi.common.exception.BadRequestException;
import com.chamapi.manual.dto.ManualListResponse;
import com.chamapi.manual.dto.ManualResponse;
import com.chamapi.manual.entity.Manual;
import com.chamapi.manual.repository.ManualRepository;
import com.chamapi.multilingual.entity.Language;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.util.HtmlUtils;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ManualService {

    private static final Pattern HTML_TAG = Pattern.compile("<[^>]*>");

    private final ManualRepository manualRepository;

    public List<ManualListResponse> getManuals(Language lang) {
        return manualRepository.findByLanguage(lang).stream()
                .map(ManualListResponse::from)
                .toList();
    }

    public List<ManualListResponse> searchManuals(Language lang, String query) {
        return manualRepository.searchByTitleOrContent(lang, query).stream()
                .filter(manual -> matchesTitleOrText(manual, query))
                .map(ManualListResponse::from)
                .toList();
    }

    // 본문은 HTML 이라 DB LIKE 는 태그·속성(style, img 등)에도 걸린다. 화면에 보이는 글자로 한 번 더 거른다.
    private static boolean matchesTitleOrText(Manual manual, String query) {
        String keyword = query.toLowerCase(Locale.ROOT);
        if (manual.getTitle() != null && manual.getTitle().toLowerCase(Locale.ROOT).contains(keyword)) {
            return true;
        }
        if (manual.getContent() == null) return false;
        String text = HTML_TAG.matcher(manual.getContent()).replaceAll(" ");
        return HtmlUtils.htmlUnescape(text).toLowerCase(Locale.ROOT).contains(keyword);
    }

    public ManualResponse getManual(Long id) {
        return ManualResponse.from(manualRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("매뉴얼을 찾을 수 없습니다. id = " + id)));
    }
}

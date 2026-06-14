package com.chamapi.multilingual.service;

import com.chamapi.multilingual.dto.MultilingualBundleResponse;
import com.chamapi.multilingual.dto.MultilingualResponse;
import com.chamapi.multilingual.entity.Language;

public interface MultilingualService {

    MultilingualResponse getTexts(String menu, Language language);

    MultilingualBundleResponse getAllTexts(String menu);

}

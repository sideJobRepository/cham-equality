package com.chamapi.multilingual.repository;

import com.chamapi.multilingual.entity.Language;
import com.chamapi.multilingual.entity.Multilingual;

import java.util.List;

public interface MultilingualQueryRepository {

    List<Multilingual> search(String menu, Language language);

}

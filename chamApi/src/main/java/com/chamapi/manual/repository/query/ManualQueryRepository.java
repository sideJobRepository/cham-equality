package com.chamapi.manual.repository.query;

import com.chamapi.manual.entity.Manual;
import com.chamapi.multilingual.entity.Language;

import java.util.List;

public interface ManualQueryRepository {

    /** 제목 또는 본문에 검색어가 들어간 매뉴얼(대소문자 무시). 본문은 HTML 이라 태그 속 글자도 걸린다. */
    List<Manual> searchByTitleOrContent(Language language, String query);
}

package com.chamapi.member.repository.query;

import com.chamapi.member.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface MemberQueryRepository {

    /** 관리자 회원 검색. keyword 가 비면 전체, 있으면 이름 또는 이메일 부분 일치. */
    Page<Member> searchByNameOrEmail(String keyword, Pageable pageable);
}

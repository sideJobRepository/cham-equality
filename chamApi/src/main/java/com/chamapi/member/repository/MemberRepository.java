package com.chamapi.member.repository;


import com.chamapi.member.entity.Member;
import com.chamapi.member.repository.query.MemberQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> , MemberQueryRepository {
    Optional<Member> findByMemberSocialId(String socialId);
}

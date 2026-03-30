package com.chamapi.member.repository;


import com.chamapi.member.entrity.Member;
import com.chamapi.member.repository.query.MemberQueryRepository;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MemberRepository extends JpaRepository<Member, Long> , MemberQueryRepository {
}

package com.chamapi.security.context;

import com.chamapi.member.entrity.Member;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@RequiredArgsConstructor
public class MemberContext implements UserDetails {
    
    private final Member member;
    private final List<GrantedAuthority> authorities;
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }
    
    @Override
    public String getPassword() {
        return "";
    }
    
    @Override
    public String getUsername() {
        return member.getMemberName();
    }
}

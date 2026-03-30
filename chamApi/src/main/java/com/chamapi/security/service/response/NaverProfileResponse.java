package com.chamapi.security.service.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class NaverProfileResponse {
    
    private String resultcode;
    private String message;
    private Response response;
    
    @AllArgsConstructor
    @NoArgsConstructor
    @Data
    public static class Response {
        private String email;
        private String nickname;
        private String profile_image;
        private String age;
        private String gender;
        private String id;
        private String name;
        private String birthday;
        private String birthyear;
        private String mobile;
        
    }
}
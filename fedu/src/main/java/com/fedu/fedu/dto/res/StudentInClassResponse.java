package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class StudentInClassResponse {
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private LocalDateTime joinedAt;
    private Integer currentLevel;
}

package com.fedu.fedu.dto.res;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fedu.fedu.utils.enums.Gender;
import com.fedu.fedu.utils.enums.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {
    
    private long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String phone;
    private Gender gender;
    
    @JsonFormat(pattern = "dd/MM/yyyy")
    private LocalDate bod;
    
    private String avatarUrl;
    private UserStatus status;
    private List<String> roles;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
}

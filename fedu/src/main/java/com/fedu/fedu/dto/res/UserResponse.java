package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.Gender;
import com.fedu.fedu.utils.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Getter
@Builder
public class UserResponse implements Serializable {
    private Long userId;
    private String email;
    private String firstName;
    private String lastName;
    private String avatarUrl;
    private List<String> roles;
    private UserStatus status;
    private Gender gender;
    private LocalDate bod;
    private String phone;
}

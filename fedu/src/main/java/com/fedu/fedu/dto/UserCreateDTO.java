package com.fedu.fedu.dto;

import com.fedu.fedu.utils.enums.UserRole;
import com.fedu.fedu.utils.enums.UserStatus;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateDTO {
    private String email;
    private String password;
    private UserStatus status;
    private UserRole userRole;
}

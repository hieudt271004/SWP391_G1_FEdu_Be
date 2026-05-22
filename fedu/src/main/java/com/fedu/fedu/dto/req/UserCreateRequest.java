package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.UserRole;
import com.fedu.fedu.utils.enums.UserStatus;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserCreateRequest {
    private String email;
    private String password;
    private UserStatus status;
    private UserRole userRole;
}

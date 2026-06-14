package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.UserStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserSetStatusRequest {
    private String userName;
    private UserStatus status;
}
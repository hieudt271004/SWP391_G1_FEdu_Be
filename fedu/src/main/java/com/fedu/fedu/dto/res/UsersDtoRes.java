package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UsersDtoRes {
    private String email;
    private String password;
}

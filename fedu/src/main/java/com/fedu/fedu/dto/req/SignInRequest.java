package com.fedu.fedu.dto.req;

import com.fedu.fedu.dto.validator.ValidEmail;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SignInRequest {
    @ValidEmail(message = "invalid email")
    @NotBlank(message = "email can not be invalid")
    private String email;

    @NotBlank(message = "Password can not be blank")
    private String password;
}

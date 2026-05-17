package com.fedu.fedu.dto.req;

import com.fedu.fedu.dto.validator.PasswordMatchValidator;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;
import lombok.Value;

@Data
@Builder
@Valid
public class ResetPassRequest {

    @NotBlank(message = "Password can not be blank")
    private String password;

    @PasswordMatchValidator
    @NotBlank(message = "Can not be blank")
    private String confirmPassword;
}

package com.fedu.fedu.dto.req;

import com.fedu.fedu.dto.validator.PasswordMatchValidator;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@PasswordMatchValidator
public class ResetPasswordDTO {

    @NotBlank(message = "Secret key không được để trống")
    private String secretKey;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu tối thiểu 8 ký tự")
    private String password;

    @NotBlank(message = "Xác nhận mật khẩu không được để trống")
    private String confirmPassword;

}
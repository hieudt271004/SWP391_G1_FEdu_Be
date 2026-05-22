package com.fedu.fedu.dto.req;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fedu.fedu.dto.validator.*;
import com.fedu.fedu.utils.enums.Gender;
import com.fedu.fedu.utils.enums.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;
import org.springframework.format.annotation.DateTimeFormat;

import java.time.LocalDate;
import java.util.Date;

@Data
@Builder
public class RegisterRequest {
    @NotBlank(message = "full name must be not blank")
    private String firstName;

    @NotBlank(message = "last name must be not blank")
    private String lastName;

    @ValidEmail(message = "invalid email")
    @NotBlank(message = "email can not be invalid")
    private String email;

    @NotBlank(message = "password can not be blank")
    private String password;

    @NotBlank(message = "password can not be blank")
    @PasswordMatchValidator
    private String confirmPassword;

    @EnumPattern(name = "status", regexp = "ACTIVE|INACTIVE|NONE")
    private UserStatus status;

}

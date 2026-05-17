package com.fedu.fedu.dto.req;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fedu.fedu.dto.validator.EnumPattern;
import com.fedu.fedu.dto.validator.GenderSubset;
import com.fedu.fedu.dto.validator.PhoneNumber;
import com.fedu.fedu.dto.validator.ValidEmail;
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
    private String fullName;

    @GenderSubset(anyOf = {Gender.MALE, Gender.FEMALE, Gender.OTHER})
    //@NotBlank(message = "gender can not be null")
    private Gender gender;

    //@NotBlank(message = "date of birth can not be null")
    @DateTimeFormat(pattern = "MM/dd/yyyy")
    @JsonFormat(pattern = "MM/dd/yyyy")
    private LocalDate bod;

    //@Pattern(regexp = "^\\d{10}$", message = "phone invalid format")
    @PhoneNumber(message = "phone invalid format")
    @NotBlank(message = "phone can not be null")
    private String phone;

    @ValidEmail(message = "invalid email")
    @NotBlank(message = "email can not be invalid")
    private String email;

    @NotBlank(message = "password can not be blank")
    private String password;

    //@NotBlank(message = "status can not be invalid")
    //@Pattern(regexp = "^ACTIVE|INACTIVE|NONE$", message = "status must be one in {ACTIVE INACTIVE NONE}")
    @EnumPattern(name = "status", regexp = "ACTIVE|INACTIVE|NONE")
    private UserStatus status;

    //@NotBlank(message = "date and birth can not be null")
//    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
//    @JsonFormat(pattern = "mm/dd/yyyy")
//    private LocalDate lastLogin;
}

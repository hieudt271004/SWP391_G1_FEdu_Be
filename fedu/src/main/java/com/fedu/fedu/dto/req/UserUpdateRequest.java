package com.fedu.fedu.dto.req;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fedu.fedu.dto.validator.GenderSubset;
import com.fedu.fedu.dto.validator.PhoneNumber;
import com.fedu.fedu.utils.enums.Gender;
import com.fedu.fedu.utils.enums.UserRole;
import com.fedu.fedu.utils.enums.UserStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserUpdateRequest {

    @NotBlank(message = "First name must not be blank")
    private String firstName;

    @NotBlank(message = "Last name must not be blank")
    private String lastName;

    @PhoneNumber(message = "Phone number invalid format")
    private String phone;

    @GenderSubset(anyOf = {Gender.MALE, Gender.FEMALE, Gender.OTHER})
    private Gender gender;

    @JsonFormat(pattern = "dd/MM/yyyy")
    private LocalDate bod;

    private String avatarUrl;

    private UserStatus status;

    private UserRole userRole;
}

package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AddStudentRequest {

    @NotBlank(message = "Student email is required")
    @Email(message = "Invalid email format")
    private String email;
}

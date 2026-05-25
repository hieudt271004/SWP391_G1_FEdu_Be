package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClassroomRequest {

    @NotNull(message = "Subject ID is required")
    private Long subjectId;

    @NotBlank(message = "Class name is required")
    private String className;

    private String semester;

    private String description;

    // lecturerId is taken from the authenticated user (TEACHER role)
    // but can be overridden by ADMIN
    private Long lecturerId;
}

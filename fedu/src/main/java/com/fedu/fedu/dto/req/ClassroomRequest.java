package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ClassroomRequest {

    @NotBlank(message = "Class name is required")
    private String className;

    private String semester;

    private String description;

    private String status;
}

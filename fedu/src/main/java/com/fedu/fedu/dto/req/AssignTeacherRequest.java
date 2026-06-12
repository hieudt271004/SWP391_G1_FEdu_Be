package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AssignTeacherRequest {

    @NotNull(message = "Teacher ID is required")
    private Long teacherId;
}

package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignTeacherRequest {

    @NotNull(message = "Teacher ID is required")
    private Long teacherId;
}

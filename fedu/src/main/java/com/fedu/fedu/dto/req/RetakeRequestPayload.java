package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class RetakeRequestPayload {

    @NotNull(message = "classroomSubjectId is required")
    private Long classroomSubjectId;

    @NotNull(message = "testId is required")
    private Long testId;

    private String requestReason;
}

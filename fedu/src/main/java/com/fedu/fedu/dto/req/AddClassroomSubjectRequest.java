package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AddClassroomSubjectRequest {
    @NotNull(message = "subjectId là bắt buộc")
    private Long subjectId;
    @NotNull(message = "lecturerId là bắt buộc")
    private Long lecturerId;
}

package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeLecturerRequest {
    @NotNull(message = "lecturerId là bắt buộc")
    private Long lecturerId;
}

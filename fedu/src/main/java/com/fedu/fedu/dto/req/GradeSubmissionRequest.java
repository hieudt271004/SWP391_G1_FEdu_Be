package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradeSubmissionRequest {

    @NotNull(message = "Điểm không được để trống")
    private BigDecimal grade;

    private String feedback;
}

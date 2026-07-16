package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreBandRequest {

    @NotNull(message = "minScore là bắt buộc")
    @DecimalMin(value = "0.0", message = "minScore >= 0")
    private BigDecimal minScore;

    @NotNull(message = "maxScore là bắt buộc")
    @DecimalMax(value = "100.0", message = "maxScore <= 100")
    private BigDecimal maxScore;

    @NotNull(message = "targetLevel là bắt buộc")
    @Min(value = 1, message = "targetLevel từ 1 đến 3")
    @Max(value = 3, message = "targetLevel từ 1 đến 3")
    private Integer targetLevel;
}

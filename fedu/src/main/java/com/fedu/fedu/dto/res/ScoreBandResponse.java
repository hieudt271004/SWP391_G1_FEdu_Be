package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScoreBandResponse {
    private Long bandId;
    private Long testId;
    private BigDecimal minScore;
    private BigDecimal maxScore;
    private Integer targetLevel;
}

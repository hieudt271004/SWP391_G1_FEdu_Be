package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptSubmissionResultResponse {
    private Long attemptId;
    private BigDecimal score;
    private Boolean passed;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private BigDecimal passingPercentage;
    
    private Integer newLevel;
    
    private Boolean pendingManualGrading;
}

package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTestDetailsResponse {
    private Long testId;
    private String title;
    private String description;
    private Integer durationMinutes;
    private BigDecimal passingPercentage;
    
    private java.time.LocalDateTime releaseEndsAt;
    private List<QuestionResponse> questions;
}

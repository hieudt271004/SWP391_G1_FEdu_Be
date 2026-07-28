package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttemptResponse {
    private Long attemptId;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private BigDecimal score;
    private Boolean passed;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    
    private String status;
    
    private Integer tabOutCount;

    private Long testId;
    private String testTitle;
}

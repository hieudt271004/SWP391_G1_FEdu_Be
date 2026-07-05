package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentTestAttemptHistoryResponse {
    private Long attemptId;
    private Long testId;
    private String classroomSubjectName;
    private String testTitle;
    private String testDescription;
    private BigDecimal score;
    private LocalDateTime submittedAt;
    private Integer tabOutCount;
}

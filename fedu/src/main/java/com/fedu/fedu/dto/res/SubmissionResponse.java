package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionResponse {
    private Long submissionId;
    private Long exerciseId;
    private Long nodeId;
    private Long studentId;
    private String studentName;
    private String content;
    private String fileUrl;
    private String status;
    private BigDecimal grade;
    private String feedback;
    private Long gradedById;
    private String gradedByName;
    private LocalDateTime submittedAt;
    private LocalDateTime gradedAt;
    private String exerciseTitle;
}

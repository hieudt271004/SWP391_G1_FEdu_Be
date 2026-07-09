package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.PopQuizAssignmentStatus;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopQuizAssignmentResponse {
    private Long assignmentId;
    private Long testId;
    private Long nodeId;
    private String title;
    private Integer durationMinutes;
    private PopQuizAssignmentStatus status;
    private LocalDateTime closeAt;
    private Integer targetStudentCount;
}

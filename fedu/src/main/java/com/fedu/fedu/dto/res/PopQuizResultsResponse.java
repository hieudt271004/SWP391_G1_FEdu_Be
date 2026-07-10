package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.PopQuizAssignmentStatus;
import com.fedu.fedu.utils.enums.PopQuizStudentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopQuizResultsResponse {
    private Long assignmentId;
    private String title;
    private PopQuizAssignmentStatus status;
    private List<StudentResult> students;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentResult {
        private Long studentId;
        private String studentName;
        private PopQuizStudentStatus status;
        private BigDecimal score;
        private Integer tabOutCount;
    }
}

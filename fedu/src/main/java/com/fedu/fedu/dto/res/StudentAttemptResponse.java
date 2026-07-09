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
    /** AttemptStatus name (IN_PROGRESS/SUBMITTED/...) — phân biệt "đang làm" vs "đã nộp" cho màn hình theo dõi. */
    private String status;
    /** Số lần rời tab trong lượt làm bài (chống gian lận). */
    private Integer tabOutCount;
}

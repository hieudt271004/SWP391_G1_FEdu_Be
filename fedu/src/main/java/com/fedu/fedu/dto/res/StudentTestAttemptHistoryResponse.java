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
    // AttemptStatus name — CANCELLED = lần nộp cũ bị hủy khi duyệt thi lại (chỉ hiển thị tham khảo)
    private String status;
    private LocalDateTime submittedAt;
    private Integer tabOutCount;
}

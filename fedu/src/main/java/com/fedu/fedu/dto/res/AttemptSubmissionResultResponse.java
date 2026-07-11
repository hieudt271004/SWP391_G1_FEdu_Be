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
    /** Mức mới của học sinh nếu bài này làm ĐỔI MỨC (gate/free-choice); null = không đổi. */
    private Integer newLevel;
    /** true = đề có câu tự luận, chờ giáo viên chấm (score/passed chưa có, chưa định tuyến). */
    private Boolean pendingManualGrading;
}

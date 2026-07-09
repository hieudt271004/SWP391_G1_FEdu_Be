package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.PopQuizStudentStatus;
import lombok.*;

import java.math.BigDecimal;

/**
 * Trả về cho học sinh khi polling màn hình ON_CLASS. KHÔNG bao giờ chứa đáp án đúng.
 * data = null khi không có assignment nào giao cho học sinh này tại node đó.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopQuizPendingResponse {
    private Long assignmentId;
    private String title;
    private Integer durationMinutes;
    private PopQuizStudentStatus status;
    /** Chỉ có giá trị khi status = IN_PROGRESS. */
    private Long remainingSeconds;
    /** Chỉ có giá trị khi status = SUBMITTED hoặc EXPIRED. */
    private BigDecimal score;
}

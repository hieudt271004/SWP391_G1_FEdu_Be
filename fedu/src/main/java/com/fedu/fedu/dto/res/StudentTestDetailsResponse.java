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
    /** Hạn nộp CHUNG cả lớp của đề phát trong buổi live; null = chỉ tính giờ theo durationMinutes. */
    private java.time.LocalDateTime releaseEndsAt;
    private List<QuestionResponse> questions;
}

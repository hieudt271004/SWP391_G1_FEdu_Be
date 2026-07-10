package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeTestResponse {
    private Long testId;
    private String title;
    private String description;
    private Integer durationMinutes;
    private BigDecimal passingPercentage;
    private Integer orderIndex;
    /** null = đề đã soạn nhưng CHƯA phát (ẩn với học sinh). */
    private java.time.LocalDateTime releasedAt;
    /** Hạn nộp chung cả lớp khi phát trong buổi live; null = không giới hạn chung. */
    private java.time.LocalDateTime releaseEndsAt;
}

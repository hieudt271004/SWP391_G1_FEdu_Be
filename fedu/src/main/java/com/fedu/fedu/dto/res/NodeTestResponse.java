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
}

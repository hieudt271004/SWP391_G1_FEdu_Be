package com.fedu.fedu.dto.res;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentLevelHistoryResponse {
    private Long id;
    private Integer oldLevel;
    private Integer newLevel;
    private String reason; 
    private LocalDateTime changedAt;
}

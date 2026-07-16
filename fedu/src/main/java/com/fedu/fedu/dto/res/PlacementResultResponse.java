package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementResultResponse {
    private Long testId;
    private BigDecimal score;
    private Integer assignedLevel; 
    
    private Boolean pendingManualGrading;
}

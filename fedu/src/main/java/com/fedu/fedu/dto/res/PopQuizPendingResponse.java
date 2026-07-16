package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.PopQuizStudentStatus;
import lombok.*;

import java.math.BigDecimal;





@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PopQuizPendingResponse {
    private Long assignmentId;
    private String title;
    private Integer durationMinutes;
    private PopQuizStudentStatus status;
    
    private Long remainingSeconds;
    
    private BigDecimal score;
}

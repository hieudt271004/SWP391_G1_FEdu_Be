package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.QuestionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;






@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptGradingDetailResponse {
    private Long attemptId;
    private Long testId;
    private String testTitle;
    private Long studentId;
    private String studentName;
    
    private String status;
    
    private BigDecimal score;
    private LocalDateTime submittedAt;
    private List<ResponseGradingItem> responses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResponseGradingItem {
        private Long responseId;
        private Long questionId;
        private String questionContent;
        private QuestionType questionType;
        
        private BigDecimal maxScore;
        
        private String responseText;
        
        private List<String> selectedAnswers;
        
        private Boolean isCorrect;
    }
}

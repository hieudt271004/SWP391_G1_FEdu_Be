package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptSubmissionRequest {
    @NotNull(message = "Danh sách câu trả lời không được rỗng")
    private List<QuestionSubmission> submissions;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionSubmission {
        @NotNull(message = "questionId không được để trống")
        private Long questionId;
        
        private List<Long> selectedAnswerIds;
        private String responseText;
    }
}

package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;







@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePopQuizRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    




    private Integer durationMinutes;

    
    private LocalDateTime closeAt;

    @NotEmpty(message = "Phải chọn ít nhất 1 học sinh")
    private List<Long> studentIds;

    
    @Size(max = 50, message = "Tối đa 50 câu hỏi")
    @Valid
    private List<QuestionInput> questions;

    
    private Long existingTestId;

    @AssertTrue(message = "Phải cung cấp đúng một nguồn đề: questions hoặc existingTestId")
    public boolean isExactlyOneQuestionSource() {
        boolean hasInline = questions != null && !questions.isEmpty();
        boolean hasExisting = existingTestId != null;
        return hasInline ^ hasExisting;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionInput {
        @NotBlank(message = "Nội dung câu hỏi không được để trống")
        private String questionContent;

        @NotNull(message = "Loại câu hỏi là bắt buộc")
        private QuestionType questionType;

        private BigDecimal score;

        @NotEmpty(message = "Câu hỏi phải có ít nhất 1 đáp án")
        @Size(max = 10, message = "Tối đa 10 đáp án mỗi câu hỏi")
        @Valid
        private List<AnswerInput> answers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerInput {
        @NotBlank(message = "Nội dung đáp án không được để trống")
        private String answerContent;

        @NotNull(message = "isCorrect là bắt buộc")
        private Boolean isCorrect;
    }
}

package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.QuestionType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class QuestionRequest {
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String questionContent;

    @NotNull(message = "Loại câu hỏi không được để trống")
    private QuestionType questionType;

    private BigDecimal score;

    private List<AnswerRequest> answers;
}

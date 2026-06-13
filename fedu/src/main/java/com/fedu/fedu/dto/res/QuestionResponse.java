package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.QuestionType;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionResponse {
    private Long questionId;
    private String questionContent;
    private QuestionType questionType;
    private BigDecimal score;
    private List<AnswerResponse> answers;
}

package com.fedu.fedu.dto.res;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerResponse {
    private Long answerId;
    private String answerContent;
    
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Boolean isCorrect;
}

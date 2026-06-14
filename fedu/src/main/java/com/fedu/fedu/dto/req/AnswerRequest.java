package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ToString
public class AnswerRequest {
    @NotBlank(message = "Nội dung đáp án không được để trống")
    private String answerContent;
    
    private Boolean isCorrect;
}

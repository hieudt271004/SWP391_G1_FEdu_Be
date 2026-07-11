package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;


@Data
public class CreateQuestionAnswerRequest {

    @NotBlank(message = "Nội dung câu trả lời không được để trống")
    private String content;
}

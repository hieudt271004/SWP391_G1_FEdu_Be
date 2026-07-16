package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;


@Data
public class CreateNodeQuestionRequest {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String content;
}

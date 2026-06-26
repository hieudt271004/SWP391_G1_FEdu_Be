package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Học sinh đặt câu hỏi (hoặc sửa) trên một node. */
@Data
public class CreateNodeQuestionRequest {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String content;
}

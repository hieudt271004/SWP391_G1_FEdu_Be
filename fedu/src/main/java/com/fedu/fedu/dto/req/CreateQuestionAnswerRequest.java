package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Giảng viên trả lời (hoặc sửa) một câu hỏi của học sinh. */
@Data
public class CreateQuestionAnswerRequest {

    @NotBlank(message = "Nội dung câu trả lời không được để trống")
    private String content;
}

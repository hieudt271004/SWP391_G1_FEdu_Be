package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketAnswerRequest {
    @NotBlank(message = "Nội dung câu trả lời không được để trống")
    private String content;
}

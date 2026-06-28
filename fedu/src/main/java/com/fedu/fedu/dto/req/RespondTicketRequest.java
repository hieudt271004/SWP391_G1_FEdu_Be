package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Yêu cầu sub-mentor hoặc giảng viên trả lời một support ticket.
 */
@Data
public class RespondTicketRequest {

    /** Nội dung trả lời. */
    @NotBlank(message = "Nội dung trả lời không được để trống")
    private String messageResponse;
}

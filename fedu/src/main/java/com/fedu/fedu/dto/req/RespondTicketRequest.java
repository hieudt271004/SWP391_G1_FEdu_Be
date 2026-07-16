package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;




@Data
public class RespondTicketRequest {

    
    @NotBlank(message = "Nội dung trả lời không được để trống")
    private String messageResponse;
}

package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;




@Data
public class CreateSupportTicketRequest {

    
    @NotNull(message = "classroomSubjectId không được để trống")
    private Long classroomSubjectId;

    
    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    private String messageStudent;
}

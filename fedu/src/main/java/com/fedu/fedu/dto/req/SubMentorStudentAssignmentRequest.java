package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;





@Data
public class SubMentorStudentAssignmentRequest {

    
    @NotNull(message = "subMentorCssId không được để trống")
    private Long subMentorCssId;

    
    @NotNull(message = "studentCssId không được để trống")
    private Long studentCssId;
}

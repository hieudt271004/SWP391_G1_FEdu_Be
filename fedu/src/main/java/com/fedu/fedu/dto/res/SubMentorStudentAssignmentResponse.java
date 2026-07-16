package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;




@Data
@Builder
public class SubMentorStudentAssignmentResponse {

    private Long id;

    
    private Long subMentorCssId;

    
    private String subMentorName;

    
    private String subMentorEmail;

    
    private Long studentCssId;

    
    private String studentName;

    
    private String studentEmail;

    private LocalDateTime assignedAt;
}

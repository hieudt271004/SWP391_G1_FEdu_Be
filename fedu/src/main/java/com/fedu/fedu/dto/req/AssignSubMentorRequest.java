package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.Data;





@Data
public class AssignSubMentorRequest {

    
    @NotNull(message = "classroomSubjectStudentId không được để trống")
    private Long classroomSubjectStudentId;
}

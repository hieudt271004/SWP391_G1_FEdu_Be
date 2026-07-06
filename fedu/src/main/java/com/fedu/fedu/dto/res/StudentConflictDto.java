package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class StudentConflictDto {
    private Long studentId;
    private String studentName;
    private String email;
    private String conflictingSubjectName;
    private String conflictingClassName;
}

package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ClassroomSubjectResponse {
    private Long classroomSubjectId;
    private Long classroomId;
    private String className;
    private Long subjectId;
    private String subjectCode;
    private String subjectName;
    private Long lecturerId;
    private String lecturerName;
    private String displayName;   // "className - subjectCode"  (vd "SE1801 - PRJ301")
    private int studentCount;
    private Boolean isSubmentor;
}
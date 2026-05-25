package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomResponse {
    private Long classroomId;
    private String className;
    private String semester;
    private String description;

    // Subject info
    private Long subjectId;
    private String subjectCode;
    private String subjectName;

    // Lecturer info
    private Long lecturerId;
    private String lecturerEmail;
    private String lecturerFirstName;
    private String lecturerLastName;
}

package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

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
    private String lecturerName;
    private String lecturerEmail;

    private int studentCount;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String lecturerFirstName;
    private String lecturerLastName;
}

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
    private String status;

    private int subjectCount;
    private int studentCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

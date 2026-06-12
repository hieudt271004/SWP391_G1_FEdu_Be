package com.fedu.fedu.dto.res;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomLearningPathResponse {
    private Long classroomPathId;
    private Long classroomId;
    private Long originalPathId;
    private String pathName;
    private String description;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
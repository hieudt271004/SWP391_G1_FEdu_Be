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
public class LearningPathResponse {
    private Long pathId;
    private Long subjectId;
    private String pathName;
    private String description;
    private Long createdById;
    private Long classroomSubjectId;
    private com.fedu.fedu.utils.enums.LearningPathLevel level;
    private Long originalPathId;
    private LocalDateTime publishedAt;
    private Long publishedById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
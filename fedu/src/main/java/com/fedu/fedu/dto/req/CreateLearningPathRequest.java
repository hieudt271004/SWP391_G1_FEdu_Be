package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLearningPathRequest {
    @NotNull(message = "subjectId must not be null")
    private Long subjectId;
    @NotBlank(message = "pathName must not be blank")
    private String pathName;
    private String description;
    private Long classroomId;
}
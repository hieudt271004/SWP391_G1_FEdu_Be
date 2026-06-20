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
    @NotNull(message = "level (1=yếu, 2=tb, 3=khá) là bắt buộc")
    @jakarta.validation.constraints.Min(value = 1, message = "level phải từ 1 đến 3")
    @jakarta.validation.constraints.Max(value = 3, message = "level phải từ 1 đến 3")
    private Integer level;
}
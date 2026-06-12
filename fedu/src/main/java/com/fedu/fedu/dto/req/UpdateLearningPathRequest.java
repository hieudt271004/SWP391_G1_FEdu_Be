package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateLearningPathRequest {
    @NotBlank(message = "pathName must not be blank")
    private String pathName;
    private String description;
}
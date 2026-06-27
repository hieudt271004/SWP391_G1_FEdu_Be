package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNodeExerciseRequest {

    @NotBlank(message = "Tiêu đề bài tập không được để trống")
    private String title;

    private String instructions;

    private Boolean allowText;

    private Boolean allowFile;
}

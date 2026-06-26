package com.fedu.fedu.dto.res;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeExerciseResponse {
    private Long exerciseId;
    private String title;
    private String instructions;
    private Boolean allowText;
    private Boolean allowFile;
    private Integer orderIndex;
}

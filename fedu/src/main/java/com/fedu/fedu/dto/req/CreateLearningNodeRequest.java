package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateLearningNodeRequest {
    @NotNull(message = "learningPathId must not be null")
    private Long learningPathId;
    @NotBlank(message = "title must not be blank")
    private String title;
    private String description;
    @NotNull(message = "nodeType must not be null")
    private NodeType nodeType;
    private NodeStatus status;
}
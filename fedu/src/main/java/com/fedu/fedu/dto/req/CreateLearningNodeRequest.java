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
    private Long learningPathId;
    private Long classroomPathId;
    @NotBlank(message = "title must not be blank")
    private String title;
    private String description;
    @NotNull(message = "nodeType must not be null")
    private NodeType nodeType;
    private String branchName;
    @NotNull(message = "displayOrder must not be null")
    private Integer displayOrder;
    private NodeStatus status;
    private Boolean isRequired;
}
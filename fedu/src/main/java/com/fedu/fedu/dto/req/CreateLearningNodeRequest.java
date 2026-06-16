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
    
    private NodeStatus status;

    @jakarta.validation.constraints.Min(value = 0, message = "displayOrder must be greater than or equal to 0")
    private Integer displayOrder;

    private Boolean isRequired;

    private com.fedu.fedu.utils.enums.BranchType branchName;
}
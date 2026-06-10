package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeType;
import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LearningNodeResponse {
    private Long nodeId;
    private Long learningPathId;
    private String title;
    private String description;
    private NodeType nodeType;
    private NodeStatus status;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
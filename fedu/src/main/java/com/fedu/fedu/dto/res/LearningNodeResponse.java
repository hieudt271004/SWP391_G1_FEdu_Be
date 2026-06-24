package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeTestKind;
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
    private String studentStatus;
    private Boolean testLocked;
    private Integer displayOrder;
    private Boolean isRequired;
    private Boolean isDeleted;
    private Integer stageOrder;
    private Integer level;
    private NodeTestKind testKind;
    private String appliesLevels;
    private java.math.BigDecimal gateUpMin;
    private java.math.BigDecimal gateDownMax;
    private java.math.BigDecimal placementYeuMax;
    private java.math.BigDecimal placementTbMax;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
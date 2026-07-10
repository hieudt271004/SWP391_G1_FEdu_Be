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
    private java.time.LocalDate studyDate;
    private Long slotId;
    private String slotName;
    private java.time.LocalTime startTime;
    private java.time.LocalTime endTime;
    /** Hạn hoàn thành node (null = không có deadline). */
    private LocalDateTime deadlineAt;
    /** Chỉ có ở graph student: học sinh hoàn thành node SAU deadline. */
    private Boolean completedLate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
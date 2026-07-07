package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeTestKind;
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



    /** Chặng thứ mấy trong lộ trình (1..subject.learningpathLength). */
    @jakarta.validation.constraints.Min(value = 1, message = "stageOrder phải >= 1")
    private Integer stageOrder;

    /** Mức của node: null = node chung mọi mức; 1=yếu, 2=tb, 3=khá. */
    private Integer level;

    /** Loại test: NONE/GATE/PLACEMENT/FREE_CHOICE (mặc định NONE). */
    private NodeTestKind testKind;

    private String appliesLevels;
    private java.math.BigDecimal gateUpMin;
    private java.math.BigDecimal gateDownMax;
    private java.math.BigDecimal placementYeuMax;
    private java.math.BigDecimal placementTbMax;

    /** Hạn hoàn thành node cho học sinh (tùy chọn). */
    private java.time.LocalDateTime deadlineAt;
}
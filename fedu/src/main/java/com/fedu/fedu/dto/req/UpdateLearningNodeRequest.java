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
public class UpdateLearningNodeRequest {
    @NotBlank(message = "title must not be blank")
    private String title;
    private String description;
    @NotNull(message = "nodeType must not be null")
    private NodeType nodeType;
    private NodeStatus status;

    @jakarta.validation.constraints.Min(value = 0, message = "displayOrder must be greater than or equal to 0")
    private Integer displayOrder;

    private Boolean isRequired;

    private Integer stageOrder;
    private Integer level;
    private NodeTestKind testKind;

    private String appliesLevels;
    private java.math.BigDecimal gateUpMin;
    private java.math.BigDecimal gateDownMax;
    private java.math.BigDecimal placementYeuMax;
    private java.math.BigDecimal placementTbMax;
}
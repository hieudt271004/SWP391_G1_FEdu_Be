package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNodeEdgeRequest {
    @NotNull(message = "fromNodeId must not be null")
    private Long fromNodeId;
    @NotNull(message = "toNodeId must not be null")
    private Long toNodeId;
    private com.fedu.fedu.utils.enums.BranchType branchName;
    private BigDecimal minScore;
    private BigDecimal maxScore;
}
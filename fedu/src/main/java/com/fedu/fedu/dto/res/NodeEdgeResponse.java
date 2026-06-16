package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeEdgeResponse {
    private Long edgeId;
    private Long fromNodeId;
    private Long toNodeId;
    private com.fedu.fedu.utils.enums.BranchType branchName;
    private BigDecimal minScore;
    private BigDecimal maxScore;
}
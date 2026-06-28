package com.fedu.fedu.dto.res;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeEdgeResponse {
    private Long edgeId;
    private Long fromNodeId;
    private Long toNodeId;
}
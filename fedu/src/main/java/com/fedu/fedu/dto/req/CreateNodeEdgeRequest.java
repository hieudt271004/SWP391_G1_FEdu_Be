package com.fedu.fedu.dto.req;

import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNodeEdgeRequest {
    @NotNull(message = "fromNodeId must not be null")
    private Long fromNodeId;
    @NotNull(message = "toNodeId must not be null")
    private Long toNodeId;
}
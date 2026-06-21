package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomPathDto {
    private Integer level;
    private Long pathId;
    private List<LearningNodeResponse> nodes;
    private List<NodeEdgeResponse> edges;
}

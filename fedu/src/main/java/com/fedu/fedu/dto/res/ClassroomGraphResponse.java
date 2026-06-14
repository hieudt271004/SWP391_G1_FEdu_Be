package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomGraphResponse {
    private Long classroomSubjectId;
    private String state;
    private Long pathId;
    private LocalDateTime publishedAt;
    private List<LearningNodeResponse> nodes;
    private List<NodeEdgeResponse> edges;
    private List<AvailableTemplateResponse> availableTemplates;
}

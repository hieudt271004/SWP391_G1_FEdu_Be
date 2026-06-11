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
public class LearningPathGraphResponse {

    private Long pathId;

    private String pathName;

    private String description;

    private List<LearningNodeResponse> nodes;
}
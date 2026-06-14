package com.fedu.fedu.dto.res;

import lombok.*;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeContentResponse {
    private List<NodeMaterialResponse> materials;
    private List<NodeTestResponse> tests;
}

package com.fedu.fedu.dto.res;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NodeMaterialResponse {
    private Long materialId;
    private String title;
    private Boolean required;
    private Integer orderIndex;
    private VideoResponse video;
    private FileResponse file;
}

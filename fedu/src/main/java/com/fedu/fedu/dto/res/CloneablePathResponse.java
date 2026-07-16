package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CloneablePathResponse {
    private Long pathId;
    private String pathName;
    private String description;
    private String type; 
    private String creatorName;
    private int nodeCount;
    private LocalDateTime lastUpdatedAt;
}

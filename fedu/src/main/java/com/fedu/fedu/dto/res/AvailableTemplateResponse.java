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
public class AvailableTemplateResponse {
    private Long pathId;
    private String pathName;
    private String description;
    private Integer nodeCount;
    private LocalDateTime lastUpdatedAt;
}

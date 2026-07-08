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
    private String type; // "ADMIN_TEMPLATE" (của khoa) hoặc "MY_TEMPLATE" (cá nhân của GV hiện tại)
    private String creatorName;
    private int nodeCount;
    private LocalDateTime lastUpdatedAt;
}

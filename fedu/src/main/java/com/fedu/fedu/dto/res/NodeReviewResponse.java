package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NodeReviewResponse {
    private Long reviewId;
    private Long nodeId;
    private Integer rating;
    private String content;
    private Long studentId;
    private String studentName;
    private String studentAvatarUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

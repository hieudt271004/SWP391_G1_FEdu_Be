package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NodeReviewResponse {
    private Long reviewId;
    private Long nodeId;
    private Long parentReviewId;
    private Integer rating;
    private String content;
    private Long studentId;
    private String studentName;
    private String studentAvatarUrl;
    private String authorRole;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<NodeReviewResponse> replies;
}

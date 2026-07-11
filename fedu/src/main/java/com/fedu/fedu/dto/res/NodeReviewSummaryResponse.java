package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;





@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NodeReviewSummaryResponse {
    private Long nodeId;
    private Double averageRating;   
    private long reviewCount;
    private boolean canReview;      
    private NodeReviewResponse myReview;          
    private List<NodeReviewResponse> reviews;     
    private List<NodeReviewResponse> comments;    
}

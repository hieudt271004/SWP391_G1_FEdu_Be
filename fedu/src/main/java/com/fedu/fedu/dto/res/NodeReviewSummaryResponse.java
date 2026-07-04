package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Tổng hợp đánh giá của 1 node: điểm trung bình, số lượt, danh sách công khai,
 * cùng trạng thái riêng của người gọi (đánh giá của tôi / đã đủ điều kiện review chưa).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NodeReviewSummaryResponse {
    private Long nodeId;
    private Double averageRating;   // 0.0 nếu chưa có review nào
    private long reviewCount;
    private boolean canReview;      // người gọi (học sinh) đã hoàn thành khóa, được phép đánh giá
    private NodeReviewResponse myReview;          // đánh giá của người gọi (null nếu chưa có / không phải học sinh)
    private List<NodeReviewResponse> reviews;     // danh sách đánh giá công khai trong lớp-môn
}

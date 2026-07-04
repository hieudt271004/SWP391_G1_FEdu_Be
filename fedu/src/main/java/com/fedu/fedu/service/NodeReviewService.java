package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateNodeReviewRequest;
import com.fedu.fedu.dto.res.NodeReviewResponse;
import com.fedu.fedu.dto.res.NodeReviewSummaryResponse;

public interface NodeReviewService {

    // ===== Học sinh =====
    /** Xem tổng hợp đánh giá của node (kèm đánh giá của tôi + đã đủ điều kiện review chưa). */
    NodeReviewSummaryResponse getReviewsForStudent(Long nodeId, Long studentId);

    /** Gửi/cập nhật đánh giá của chính mình cho node (upsert). */
    NodeReviewResponse submitReview(Long nodeId, Long studentId, CreateNodeReviewRequest request);

    /** Xóa (mềm) đánh giá của chính mình. */
    void deleteReview(Long nodeId, Long studentId);

    // ===== Giảng viên =====
    /** Giảng viên phụ trách lớp-môn xem tổng hợp đánh giá của node. */
    NodeReviewSummaryResponse getReviewsForTeacher(Long nodeId, Long teacherId);
}

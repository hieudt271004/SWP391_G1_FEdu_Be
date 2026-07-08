package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateNodeReviewRequest;
import com.fedu.fedu.dto.res.NodeReviewResponse;
import com.fedu.fedu.dto.res.NodeReviewSummaryResponse;

public interface NodeReviewService {

    // ===== Học sinh & Giảng viên (Chung) =====
    /** Xem tổng hợp đánh giá của node (kèm đánh giá của tôi + đã đủ điều kiện review chưa). */
    NodeReviewSummaryResponse getReviewsForStudent(Long nodeId, Long studentId);

    /** Gửi/cập nhật đánh giá của chính mình cho node (upsert, chỉ học sinh). */
    NodeReviewResponse submitReview(Long nodeId, Long studentId, CreateNodeReviewRequest request);

    /** Gửi nhận xét/thảo luận (comment) cho node (học sinh hoặc giảng viên). */
    NodeReviewResponse createComment(Long nodeId, Long authorId, CreateNodeReviewRequest request);

    /** Trả lời (reply) một đánh giá hoặc thảo luận khác (học sinh hoặc giảng viên). */
    NodeReviewResponse replyToReview(Long nodeId, Long parentReviewId, Long authorId, CreateNodeReviewRequest request);

    /** Xóa (mềm) đánh giá gốc của chính mình (chỉ học sinh). */
    void deleteReview(Long nodeId, Long studentId);

    /** Xóa (mềm) một thảo luận gốc của chính mình (học sinh hoặc giảng viên). */
    void deleteComment(Long commentId, Long authorId);

    /** Xóa (mềm) một reply cụ thể của chính mình (học sinh hoặc giảng viên). */
    void deleteReply(Long replyId, Long authorId);

    // ===== Giảng viên =====
    /** Giảng viên phụ trách lớp-môn xem tổng hợp đánh giá của node. */
    NodeReviewSummaryResponse getReviewsForTeacher(Long nodeId, Long teacherId);
}


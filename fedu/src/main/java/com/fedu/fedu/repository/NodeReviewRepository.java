package com.fedu.fedu.repository;

import com.fedu.fedu.entity.NodeReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface NodeReviewRepository extends JpaRepository<NodeReview, Long> {

    /** Danh sách review gốc (không phải reply) công khai của 1 node (mới nhất trước). */
    List<NodeReview> findByLearningNodeNodeIdAndParentReviewIsNullAndIsDeletedFalseOrderByCreatedAtDesc(Long nodeId);

    /** Review gốc (còn hiệu lực, có rating) của 1 học sinh trên 1 node — dùng để hiển thị "đánh giá của tôi". */
    Optional<NodeReview> findByLearningNodeNodeIdAndAuthorUserIdAndParentReviewIsNullAndRatingIsNotNullAndIsDeletedFalse(Long nodeId, Long authorId);

    /**
     * Bản ghi review gốc (có rating) của học sinh trên node KHÔNG lọc is_deleted — dùng cho upsert
     * để tái dùng/khôi phục bản đã xóa mềm, tránh vỡ unique index trên root reviews.
     */
    Optional<NodeReview> findByLearningNodeNodeIdAndAuthorUserIdAndParentReviewIsNullAndRatingIsNotNull(Long nodeId, Long authorId);

    /** Danh sách tất cả reply công khai của 1 node (cũ nhất trước) để nạp theo lô tránh N+1. */
    List<NodeReview> findByLearningNodeNodeIdAndParentReviewIsNotNullAndIsDeletedFalseOrderByCreatedAtAsc(Long nodeId);

    /** Điểm trung bình của node (chỉ tính review gốc có rating, 0.0 nếu chưa có review nào). */
    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM NodeReview r " +
            "WHERE r.learningNode.nodeId = :nodeId AND r.parentReview IS NULL AND r.rating IS NOT NULL AND r.isDeleted = false")
    Double averageRatingByNode(@Param("nodeId") Long nodeId);
}


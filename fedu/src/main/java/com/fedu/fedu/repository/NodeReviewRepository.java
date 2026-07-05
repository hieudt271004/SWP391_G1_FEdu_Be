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

    /** Danh sách review công khai của 1 node (mới nhất trước). */
    List<NodeReview> findByLearningNodeNodeIdAndIsDeletedFalseOrderByCreatedAtDesc(Long nodeId);

    /** Review (còn hiệu lực) của 1 học sinh trên 1 node — dùng để hiển thị "đánh giá của tôi". */
    Optional<NodeReview> findByLearningNodeNodeIdAndStudentUserIdAndIsDeletedFalse(Long nodeId, Long studentId);

    /**
     * Bản ghi review của học sinh trên node KHÔNG lọc is_deleted — dùng cho upsert
     * để tái dùng/khôi phục bản đã xóa mềm, tránh vỡ UNIQUE(student_id, node_id).
     */
    Optional<NodeReview> findByLearningNodeNodeIdAndStudentUserId(Long nodeId, Long studentId);

    /** Điểm trung bình của node (0.0 nếu chưa có review nào). */
    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM NodeReview r " +
            "WHERE r.learningNode.nodeId = :nodeId AND r.isDeleted = false")
    Double averageRatingByNode(@Param("nodeId") Long nodeId);
}

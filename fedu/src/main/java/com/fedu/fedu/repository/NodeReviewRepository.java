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

    
    List<NodeReview> findByLearningNodeNodeIdAndParentReviewIsNullAndIsDeletedFalseOrderByCreatedAtDesc(Long nodeId);

    
    Optional<NodeReview> findByLearningNodeNodeIdAndAuthorUserIdAndParentReviewIsNullAndRatingIsNotNullAndIsDeletedFalse(Long nodeId, Long authorId);

    



    Optional<NodeReview> findByLearningNodeNodeIdAndAuthorUserIdAndParentReviewIsNullAndRatingIsNotNull(Long nodeId, Long authorId);

    
    List<NodeReview> findByLearningNodeNodeIdAndParentReviewIsNotNullAndIsDeletedFalseOrderByCreatedAtAsc(Long nodeId);

    
    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM NodeReview r " +
            "WHERE r.learningNode.nodeId = :nodeId AND r.parentReview IS NULL AND r.rating IS NOT NULL AND r.isDeleted = false")
    Double averageRatingByNode(@Param("nodeId") Long nodeId);
}


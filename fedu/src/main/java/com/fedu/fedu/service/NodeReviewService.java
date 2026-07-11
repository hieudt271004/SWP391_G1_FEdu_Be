package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateNodeReviewRequest;
import com.fedu.fedu.dto.res.NodeReviewResponse;
import com.fedu.fedu.dto.res.NodeReviewSummaryResponse;

public interface NodeReviewService {

    
    
    NodeReviewSummaryResponse getReviewsForStudent(Long nodeId, Long studentId);

    
    NodeReviewResponse submitReview(Long nodeId, Long studentId, CreateNodeReviewRequest request);

    
    NodeReviewResponse createComment(Long nodeId, Long authorId, CreateNodeReviewRequest request);

    
    NodeReviewResponse replyToReview(Long nodeId, Long parentReviewId, Long authorId, CreateNodeReviewRequest request);

    
    void deleteReview(Long nodeId, Long studentId);

    
    void deleteComment(Long commentId, Long authorId);

    
    void deleteReply(Long replyId, Long authorId);

    
    
    NodeReviewSummaryResponse getReviewsForTeacher(Long nodeId, Long teacherId);
}


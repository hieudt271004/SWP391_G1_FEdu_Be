package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.PlacementResultResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.StudentTestAttempt;


public interface PlacementService {

    
    StudentTestDetailsResponse getPlacementQuiz(Long classroomSubjectId, Long studentId);

    
    StudentTestAttempt startPlacementAttempt(Long classroomSubjectId, Long studentId);

    
    PlacementResultResponse submitPlacement(Long classroomSubjectId, Long attemptId,
                                            Long studentId, AttemptSubmissionRequest request);


    java.util.List<com.fedu.fedu.dto.res.StudentLevelHistoryResponse> getLevelHistory(
            Long classroomSubjectId, Long studentId);
}

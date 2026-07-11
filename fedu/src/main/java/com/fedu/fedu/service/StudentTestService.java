package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.AttemptSubmissionResultResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.StudentTestAttempt;

public interface StudentTestService {
    StudentTestDetailsResponse getStudentTestDetails(Long testId, Long studentId);

    





    StudentTestDetailsResponse getTestDetailsForPlacement(Long testId);
    
    StudentTestAttempt startTestAttempt(Long testId, Long studentId);

    





    StudentTestAttempt startTestAttemptForPlacement(Long testId, Long studentId);
    
    AttemptSubmissionResultResponse submitTestAttempt(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request);

    
    java.math.BigDecimal submitForGrading(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request);

    java.util.List<com.fedu.fedu.dto.res.StudentTestAttemptHistoryResponse> getStudentTestAttemptHistory(Long studentId);

    





    void completeNode(Long nodeId, Long studentId);

    
    int recordTabOut(Long testId, Long attemptId, Long studentId);

    
    com.fedu.fedu.dto.res.AttemptGradingDetailResponse getAttemptForGrading(Long attemptId);

    




    com.fedu.fedu.dto.res.AttemptGradingDetailResponse gradeEssayAttempt(
            Long attemptId, com.fedu.fedu.dto.req.GradeEssayRequest request);
}

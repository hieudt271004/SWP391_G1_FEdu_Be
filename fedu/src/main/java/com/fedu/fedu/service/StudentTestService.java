package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.AttemptSubmissionResultResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.StudentTestAttempt;

public interface StudentTestService {
    StudentTestDetailsResponse getStudentTestDetails(Long testId, Long studentId);
    
    StudentTestAttempt startTestAttempt(Long testId, Long studentId);
    
    AttemptSubmissionResultResponse submitTestAttempt(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request);
}

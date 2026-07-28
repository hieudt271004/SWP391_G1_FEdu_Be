package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.req.CreatePopQuizRequest;
import com.fedu.fedu.dto.res.*;





public interface PopQuizService {

    

    PopQuizAssignmentResponse createAndAssign(Long nodeId, CreatePopQuizRequest request, Long teacherId);

    PopQuizAssignmentResponse getActiveAssignment(Long nodeId, Long teacherId);

    PopQuizResultsResponse getResults(Long assignmentId, Long teacherId);

    void resetStudent(Long assignmentId, Long classroomSubjectStudentId, Long teacherId);

    void closeAssignment(Long assignmentId, Long teacherId);

    

    
    PopQuizPendingResponse getPending(Long nodeId, Long studentId);

    PopQuizPendingResponse getPendingByClassroomSubject(Long classroomSubjectId, Long studentId);

    PopQuizPaperResponse startAttempt(Long assignmentId, Long studentId);

    PopQuizPaperResponse getPaper(Long assignmentId, Long studentId);

    AttemptSubmissionResultResponse submit(Long assignmentId, Long studentId, AttemptSubmissionRequest request);
}

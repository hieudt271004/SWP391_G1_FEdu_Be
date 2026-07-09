package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.req.CreatePopQuizRequest;
import com.fedu.fedu.dto.res.*;

/**
 * Giao, hiển thị, làm, chấm và quản lý bài kiểm tra ad-hoc (pop quiz) trong buổi ON_CLASS
 * cho một nhóm học sinh được chọn. Điểm không tác động routing/level/learning path.
 */
public interface PopQuizService {

    // ---- Teacher side ----

    PopQuizAssignmentResponse createAndAssign(Long nodeId, CreatePopQuizRequest request, Long teacherId);

    PopQuizAssignmentResponse getActiveAssignment(Long nodeId, Long teacherId);

    PopQuizResultsResponse getResults(Long assignmentId, Long teacherId);

    void resetStudent(Long assignmentId, Long classroomSubjectStudentId, Long teacherId);

    void closeAssignment(Long assignmentId, Long teacherId);

    // ---- Student side ----

    /** data = null khi không có assignment nào giao cho học sinh này tại node đó. */
    PopQuizPendingResponse getPending(Long nodeId, Long studentId);

    PopQuizPaperResponse startAttempt(Long assignmentId, Long studentId);

    PopQuizPaperResponse getPaper(Long assignmentId, Long studentId);

    AttemptSubmissionResultResponse submit(Long assignmentId, Long studentId, AttemptSubmissionRequest request);
}

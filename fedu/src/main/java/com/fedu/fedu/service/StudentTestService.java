package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.AttemptSubmissionResultResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.StudentTestAttempt;

public interface StudentTestService {
    StudentTestDetailsResponse getStudentTestDetails(Long testId, Long studentId);
    
    StudentTestAttempt startTestAttempt(Long testId, Long studentId);
    
    AttemptSubmissionResultResponse submitTestAttempt(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request);

    /** Chấm điểm một lượt thi và trả về điểm % (không định tuyến). Dùng cho bài phân loại. */
    java.math.BigDecimal submitForGrading(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request);

    java.util.List<com.fedu.fedu.dto.res.StudentTestAttemptHistoryResponse> getStudentTestAttemptHistory(Long studentId);

    /** Ghi nhận một lần học sinh rời tab khi đang làm bài; trả về tổng số lần đã rời của lượt thi. */
    int recordTabOut(Long testId, Long attemptId, Long studentId);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.AttemptSubmissionResultResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.StudentTestAttempt;

public interface StudentTestService {
    StudentTestDetailsResponse getStudentTestDetails(Long testId, Long studentId);

    /**
     * Lấy chi tiết đề thi dành riêng cho placement quiz.
     * Bỏ qua kiểm tra tiến độ học tập (StudentNodeProgress) vì học sinh
     * chưa có tiến độ trước khi làm bài phân loại đầu vào.
     * Quyền truy cập đã được kiểm soát bởi PlacementService.
     */
    StudentTestDetailsResponse getTestDetailsForPlacement(Long testId);
    
    StudentTestAttempt startTestAttempt(Long testId, Long studentId);

    /**
     * Bắt đầu lượt thi dành riêng cho placement quiz.
     * Bỏ qua kiểm tra tiến độ học tập (StudentNodeProgress) vì học sinh
     * chưa có tiến độ trước khi làm bài phân loại đầu vào.
     * Quyền truy cập đã được kiểm soát bởi PlacementService.
     */
    StudentTestAttempt startTestAttemptForPlacement(Long testId, Long studentId);
    
    AttemptSubmissionResultResponse submitTestAttempt(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request);

    /** Chấm điểm một lượt thi và trả về điểm % (không định tuyến). Dùng cho bài phân loại. */
    java.math.BigDecimal submitForGrading(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request);

    java.util.List<com.fedu.fedu.dto.res.StudentTestAttemptHistoryResponse> getStudentTestAttemptHistory(Long studentId);

    /** Ghi nhận một lần học sinh rời tab khi đang làm bài; trả về tổng số lần đã rời của lượt thi. */
    int recordTabOut(Long testId, Long attemptId, Long studentId);
}

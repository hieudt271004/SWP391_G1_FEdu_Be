package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.PlacementResultResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.StudentTestAttempt;

/** Luồng bài test phân loại đầu vào (placement) của học sinh trong một lớp-môn. */
public interface PlacementService {

    /** Lấy đề bài test phân loại; chỉ khi học sinh chưa được phân mức. */
    StudentTestDetailsResponse getPlacementQuiz(Long classroomSubjectId, Long studentId);

    /** Bắt đầu một lượt làm bài test phân loại. */
    StudentTestAttempt startPlacementAttempt(Long classroomSubjectId, Long studentId);

    /** Nộp bài phân loại: chấm điểm → gán mức ban đầu → khởi tạo tiến trình học. */
    PlacementResultResponse submitPlacement(Long classroomSubjectId, Long attemptId,
                                            Long studentId, AttemptSubmissionRequest request);

    /** Lịch sử thay đổi mức của một học sinh trong lớp-môn, theo thứ tự thời gian. */
    java.util.List<com.fedu.fedu.dto.res.StudentLevelHistoryResponse> getLevelHistory(
            Long classroomSubjectId, Long studentId);
}

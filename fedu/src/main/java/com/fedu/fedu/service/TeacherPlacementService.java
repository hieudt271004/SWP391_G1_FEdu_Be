package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.ScoreBandRequest;
import com.fedu.fedu.dto.res.ScoreBandResponse;

import java.util.List;

/** Cấu hình bài test phân loại và khoảng điểm (score band) — phía giảng viên. */
public interface TeacherPlacementService {

    /** Gán bài test phân loại cho lớp-môn (set classroom_subjects.id_quiz_start). */
    void setPlacementQuiz(Long classroomSubjectId, Long testId, Long teacherId);

    /** Thay toàn bộ khoảng điểm của một bài quiz; validate phủ kín 0..100 và không chồng lấn. */
    List<ScoreBandResponse> configureScoreBands(Long testId, List<ScoreBandRequest> bands, Long teacherId);

    /** Lấy khoảng điểm hiện có của một bài quiz. */
    List<ScoreBandResponse> getScoreBands(Long testId);
}

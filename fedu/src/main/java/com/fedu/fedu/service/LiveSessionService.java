package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.LiveSessionStateResponse;

/**
 * Buổi học live của node ON_CLASS: teacher bắt đầu/kết thúc trong khung giờ slot,
 * phát đề với hạn nộp chung; hai phía polling live-state để đồng bộ.
 */
public interface LiveSessionService {
    LiveSessionStateResponse getTeacherState(Long classroomSubjectId, Long nodeId, Long teacherId);
    LiveSessionStateResponse getStudentState(Long classroomSubjectId, Long nodeId, Long studentId);
    LiveSessionStateResponse startSession(Long classroomSubjectId, Long nodeId, Long teacherId);
    LiveSessionStateResponse endSession(Long classroomSubjectId, Long nodeId, Long teacherId);
    LiveSessionStateResponse releaseTest(Long classroomSubjectId, Long nodeId, Long testId, Long teacherId);
}

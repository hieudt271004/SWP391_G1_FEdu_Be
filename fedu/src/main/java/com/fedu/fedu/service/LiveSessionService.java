package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.LiveSessionStateResponse;





public interface LiveSessionService {
    LiveSessionStateResponse getTeacherState(Long classroomSubjectId, Long nodeId, Long teacherId);
    LiveSessionStateResponse getStudentState(Long classroomSubjectId, Long nodeId, Long studentId);
    LiveSessionStateResponse startSession(Long classroomSubjectId, Long nodeId, Long teacherId);
    LiveSessionStateResponse endSession(Long classroomSubjectId, Long nodeId, Long teacherId);
    LiveSessionStateResponse releaseTest(Long classroomSubjectId, Long nodeId, Long testId, Long teacherId);
}

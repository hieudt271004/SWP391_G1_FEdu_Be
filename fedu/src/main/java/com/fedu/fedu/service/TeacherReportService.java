package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.StudentProgressReportResponse;

import java.util.List;


public interface TeacherReportService {
    List<StudentProgressReportResponse> getProgressReport(Long classroomSubjectId, Long teacherId);
}

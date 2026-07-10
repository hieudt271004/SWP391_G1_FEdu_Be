package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.StudentProgressReportResponse;

import java.util.List;

/** Báo cáo theo dõi học sinh (tiến độ + hoàn thành trễ) cho giảng viên phụ trách lớp-môn. */
public interface TeacherReportService {
    List<StudentProgressReportResponse> getProgressReport(Long classroomSubjectId, Long teacherId);
}

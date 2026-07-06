package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.StudentScheduleEntry;
import java.util.List;

public interface StudentScheduleService {
    List<StudentScheduleEntry> getStudentSchedule(Long studentId);
}

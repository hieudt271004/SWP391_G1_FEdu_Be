package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.ClassroomGraphResponse;

public interface StudentProgressService {
    ClassroomGraphResponse getStudentClassroomGraph(Long classroomId, Long studentId);
}

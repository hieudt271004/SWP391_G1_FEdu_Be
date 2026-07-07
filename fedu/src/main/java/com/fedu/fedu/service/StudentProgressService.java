package com.fedu.fedu.service;

import com.fedu.fedu.dto.res.ClassroomGraphResponse;

import java.util.List;

public interface StudentProgressService {
    ClassroomGraphResponse getStudentClassroomGraph(Long classroomId, Long studentId);
    void markMaterialAsCompleted(Long materialId, Long studentId);
    List<Long> getCompletedMaterialIds(Long studentId);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.StudentInClassResponse;

import java.util.List;

public interface ClassroomStudentService {

    StudentInClassResponse addStudentToClassroomSubject(Long classroomSubjectId, AddStudentRequest request);
    void removeStudentFromClassroomSubject(Long classroomSubjectId, long studentId);
    List<StudentInClassResponse> getStudentsInClassroomSubject(Long classroomSubjectId);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.StudentInClassResponse;

import java.util.List;

public interface ClassroomStudentService {

    StudentInClassResponse addStudentToClassroom(Long classroomId, AddStudentRequest request);

    void removeStudentFromClassroom(Long classroomId, long studentId);

    List<StudentInClassResponse> getStudentsInClassroom(Long classroomId);
}

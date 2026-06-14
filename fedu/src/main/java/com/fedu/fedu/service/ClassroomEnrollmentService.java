package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.StudentInClassResponse;

public interface ClassroomEnrollmentService {
    StudentInClassResponse enrollStudent(Long classroomId, AddStudentRequest request);
}

package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.service.ClassroomEnrollmentService;
import com.fedu.fedu.service.ClassroomStudentService;
import com.fedu.fedu.service.LearningPathService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomEnrollmentServiceImpl implements ClassroomEnrollmentService {

    private final ClassroomStudentService classroomStudentService;
    private final LearningPathService learningPathService;

    @Override
    @Transactional
    public StudentInClassResponse enrollStudent(Long classroomId, AddStudentRequest request) {
        log.info("Enrolling student '{}' to classroom: {}", request.getEmail(), classroomId);
        StudentInClassResponse studentResponse = classroomStudentService.addStudentToClassroom(classroomId, request);
        learningPathService.backfillProgressForStudent(classroomId, studentResponse.getUserId());
        return studentResponse;
    }
}

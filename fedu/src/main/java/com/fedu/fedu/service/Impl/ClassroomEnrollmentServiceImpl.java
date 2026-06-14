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
    public StudentInClassResponse enrollStudent(Long classroomSubjectId, AddStudentRequest request) {
        StudentInClassResponse studentResponse =
                classroomStudentService.addStudentToClassroomSubject(classroomSubjectId, request);
        learningPathService.backfillProgressForStudent(classroomSubjectId, studentResponse.getUserId());
        return studentResponse;
    }
}

package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.entity.ClassroomStudent;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.ClassroomStudentRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.ClassroomStudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomStudentServiceImpl implements ClassroomStudentService {

    private final ClassroomStudentRepository classroomStudentRepository;
    private final ClassroomRepository classroomRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional
    public StudentInClassResponse addStudentToClassroom(Long classroomId, AddStudentRequest request) {
        log.info("Adding student '{}' to classroom id: {}", request.getEmail(), classroomId);

        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        UserAccount student = userAccountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found with email: " + request.getEmail()));

        // Check if student is already enrolled in the classroom
        if (classroomStudentRepository.existsByClassroom_ClassroomIdAndStudent_UserId(classroomId, student.getUserId())) {
            throw new InvalidDataException("Student '" + request.getEmail() + "' is already enrolled in this classroom");
        }

        ClassroomStudent enrollment = ClassroomStudent.builder()
                .classroom(classroom)
                .student(student)
                .build();

        ClassroomStudent saved = classroomStudentRepository.save(enrollment);
        log.info("Student id: {} enrolled in classroom id: {}", student.getUserId(), classroomId);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void removeStudentFromClassroom(Long classroomId, long studentId) {
        log.info("Removing student id: {} from classroom id: {}", studentId, classroomId);

        ClassroomStudent enrollment = classroomStudentRepository
                .findByClassroom_ClassroomIdAndStudent_UserId(classroomId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student id " + studentId + " not found in classroom id " + classroomId));

        classroomStudentRepository.delete(enrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentInClassResponse> getStudentsInClassroom(Long classroomId) {
        // Validate that the classroom exists and is active
        classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));

        return classroomStudentRepository.findAllByClassroomId(classroomId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private StudentInClassResponse toResponse(ClassroomStudent cs) {
        UserAccount student = cs.getStudent();
        return StudentInClassResponse.builder()
                .userId(student.getUserId())
                .email(student.getEmail())
                .firstName(student.getFirstName())
                .lastName(student.getLastName())
                .avatarUrl(student.getAvatarUrl())
                .joinedAt(cs.getJoinedAt())
                .build();
    }
}
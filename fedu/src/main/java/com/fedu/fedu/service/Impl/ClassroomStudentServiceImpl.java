package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
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

    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional
    public StudentInClassResponse addStudentToClassroom(Long classroomId, AddStudentRequest request) {
        log.info("Adding student '{}' to classroomId: {}", request.getEmail(), classroomId);

        // Tìm ClassroomSubject đầu tiên của classroom (hoặc mở rộng sau nếu cần subjectId)
        ClassroomSubject classroomSubject = classroomSubjectRepository
                .findByClassroomClassroomId(classroomId)
                .stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No subject found for classroom id: " + classroomId));

        // Tìm student theo email
        UserAccount student = userAccountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        // Kiểm tra đã enroll chưa
        classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubject.getId(), student.getUserId())
                .ifPresent(existing -> {
                    throw new IllegalStateException("Student already enrolled in this classroom");
                });

        ClassroomSubjectStudent enrollment = ClassroomSubjectStudent.builder()
                .classroomSubject(classroomSubject)
                .student(student)
                .build();

        ClassroomSubjectStudent saved = classroomSubjectStudentRepository.save(enrollment);
        log.info("Student id: {} enrolled in classroom id: {}", student.getUserId(), classroomId);

        return toResponse(saved);
    }

    @Override
    @Transactional
    public void removeStudentFromClassroom(Long classroomId, long studentId) {
        log.info("Removing student id: {} from classroomId: {}", studentId, classroomId);

        ClassroomSubject classroomSubject = classroomSubjectRepository
                .findByClassroomClassroomId(classroomId)
                .stream().findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("No subject found for classroom id: " + classroomId));

        ClassroomSubjectStudent enrollment = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubject.getId(), studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Student id " + studentId + " not enrolled in classroom id " + classroomId));

        classroomSubjectStudentRepository.delete(enrollment);
        log.info("Student id: {} removed from classroom id: {}", studentId, classroomId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentInClassResponse> getStudentsInClassroom(Long classroomId) {
        return classroomSubjectStudentRepository
                .findAllByClassroomId(classroomId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── Mapper ──────────────────────────────────────────────────────────────

    private StudentInClassResponse toResponse(ClassroomSubjectStudent enrollment) {
        UserAccount s = enrollment.getStudent();
        return StudentInClassResponse.builder()
                .userId(s.getUserId())
                .email(s.getEmail())
                .firstName(s.getFirstName())
                .lastName(s.getLastName())
                .avatarUrl(s.getAvatarUrl())
                .joinedAt(enrollment.getJoinedAt())
                .build();
    }
}

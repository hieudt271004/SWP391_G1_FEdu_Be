package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.LearningPathRepository;
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
    private final LearningPathRepository learningPathRepository;

    @Override
    @Transactional
    public StudentInClassResponse addStudentToClassroomSubject(Long classroomSubjectId, AddStudentRequest request) {
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom-subject not found with id: " + classroomSubjectId));

        UserAccount student = userAccountRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + request.getEmail()));

        // chỉ nhận đúng role STUDENT
        boolean isStudent = student.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getRoleName() == com.fedu.fedu.utils.enums.UserRole.STUDENT);
        if (!isStudent) {
            throw new InvalidDataException("Tài khoản này không phải học sinh");
        }

        classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, student.getUserId())
                .ifPresent(e -> { throw new InvalidDataException("Sinh viên đã có trong lớp-môn này"); });

        ClassroomSubjectStudent enrollment = ClassroomSubjectStudent.builder()
                .classroomSubject(cs)
                .student(student)
                .build();
        return toResponse(classroomSubjectStudentRepository.save(enrollment));
    }

    @Override
    @Transactional
    public void removeStudentFromClassroomSubject(Long classroomSubjectId, long studentId) {
        // Lớp đã bắt đầu (lộ trình đã PUBLISHED) thì không cho xóa SV — giữ dữ liệu, SV chỉ là không qua môn.
        boolean published = learningPathRepository
                .findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId)
                .stream()
                .anyMatch(p -> p.getPublishedAt() != null);
        if (published) {
            throw new InvalidDataException(
                    "Lớp đã bắt đầu (lộ trình đã xuất bản) — không thể xóa sinh viên. Dữ liệu được giữ lại, sinh viên chỉ là không qua môn.");
        }

        ClassroomSubjectStudent enrollment = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Sinh viên " + studentId + " không có trong lớp-môn " + classroomSubjectId));
        classroomSubjectStudentRepository.delete(enrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentInClassResponse> getStudentsInClassroomSubject(Long classroomSubjectId) {
        return classroomSubjectStudentRepository.findAllByClassroomSubjectId(classroomSubjectId)
                .stream().map(this::toResponse).collect(Collectors.toList());
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
                .currentLevel(enrollment.getCurrentLevel())
                .assignedPathName(enrollment.getAssignedPath() != null ? enrollment.getAssignedPath().getPathName() : null)
                .build();
    }
}

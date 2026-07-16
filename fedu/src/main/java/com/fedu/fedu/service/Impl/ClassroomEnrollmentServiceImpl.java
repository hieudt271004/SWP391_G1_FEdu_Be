package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.req.StudentImportRow;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.ClassroomEnrollmentService;
import com.fedu.fedu.service.ClassroomStudentService;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.service.UserAccountService;
import com.fedu.fedu.utils.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomEnrollmentServiceImpl implements ClassroomEnrollmentService {

    private final ClassroomStudentService classroomStudentService;
    private final LearningPathService learningPathService;
    private final UserAccountRepository userAccountRepository;
    private final UserAccountService userAccountService;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;

    @Override
    @Transactional
    public StudentInClassResponse enrollStudent(Long classroomSubjectId, AddStudentRequest request) {
        StudentInClassResponse studentResponse =
                classroomStudentService.addStudentToClassroomSubject(classroomSubjectId, request);
        learningPathService.backfillProgressForStudent(classroomSubjectId, studentResponse.getUserId());
        return studentResponse;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ImportRowResult enrollByImport(Long classroomSubjectId, StudentImportRow row) {
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Classroom-subject not found with id: " + classroomSubjectId));

        UserAccount student = userAccountRepository.findByEmail(row.getEmail()).orElse(null);
        boolean newAccount = false;
        if (student == null) {
            student = userAccountService.createStudentAccount(
                    row.getEmail(), row.getFirstName(), row.getLastName(),
                    row.getGender(), row.getDob(), row.getPhone(), DEFAULT_STUDENT_PASSWORD);
            newAccount = true;
        } else {
            boolean isStudent = student.getUserRoles().stream()
                    .anyMatch(ur -> ur.getRole().getRoleName() == UserRole.STUDENT);
            if (!isStudent) {
                throw new InvalidDataException("Tài khoản này không phải học sinh");
            }
        }

        if (classroomSubjectStudentRepository
                .existsByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, student.getUserId())) {
            return new ImportRowResult(newAccount, true); 
        }

        ClassroomSubjectStudent enrollment = ClassroomSubjectStudent.builder()
                .classroomSubject(cs)
                .student(student)
                .build();
        classroomSubjectStudentRepository.save(enrollment);
        learningPathService.backfillProgressForStudent(classroomSubjectId, student.getUserId());

        return new ImportRowResult(newAccount, false);
    }
}

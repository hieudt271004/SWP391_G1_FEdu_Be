package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AddClassroomSubjectRequest;
import com.fedu.fedu.dto.res.ClassroomSubjectResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.SubjectRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.ClassroomSubjectService;
import com.fedu.fedu.utils.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ClassroomSubjectServiceImpl implements ClassroomSubjectService {

    private final ClassroomRepository classroomRepository;
    private final SubjectRepository subjectRepository;
    private final UserAccountRepository userAccountRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;

    @Override
    @Transactional
    public ClassroomSubjectResponse addSubjectToClassroom(Long classroomId, AddClassroomSubjectRequest req) {
        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));
        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(req.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + req.getSubjectId()));
        UserAccount lecturer = userAccountRepository.findById(req.getLecturerId())
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found with id: " + req.getLecturerId()));
        assertIsTeacher(lecturer);

        // Chặn trùng môn trong lớp (DB cũng có UNIQUE(classroom_id, subject_id))
        classroomSubjectRepository
                .findByClassroomClassroomIdAndSubjectSubjectId(classroomId, req.getSubjectId())
                .ifPresent(cs -> { throw new InvalidDataException("Lớp đã có môn này"); });

        ClassroomSubject cs = ClassroomSubject.builder()
                .classroom(classroom)
                .subject(subject)
                .lecturer(lecturer)
                .build();
        classroomSubjectRepository.save(cs);
        log.info("Added subject {} (lecturer {}) to classroom {}", subject.getSubjectCode(), lecturer.getUserId(), classroomId);
        return toResponse(cs);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomSubjectResponse> getSubjectsOfClassroom(Long classroomId) {
        return classroomSubjectRepository.findByClassroomClassroomId(classroomId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomSubjectResponse> getClassroomsBySubject(Long subjectId) {
        return classroomSubjectRepository.findBySubjectSubjectId(subjectId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public ClassroomSubjectResponse changeLecturer(Long classroomSubjectId, Long lecturerId) {
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom-subject not found with id: " + classroomSubjectId));
        UserAccount lecturer = userAccountRepository.findById(lecturerId)
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found with id: " + lecturerId));
        assertIsTeacher(lecturer);
        cs.setLecturer(lecturer);
        classroomSubjectRepository.save(cs);
        return toResponse(cs);
    }

    @Override
    @Transactional
    public void removeClassroomSubject(Long classroomSubjectId) {
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom-subject not found with id: " + classroomSubjectId));
        classroomSubjectRepository.delete(cs);
        log.info("Removed classroom-subject id: {}", classroomSubjectId);
    }

    // ── helpers ──────────────────────────────────────────────────────────────
    private void assertIsTeacher(UserAccount user) {
        boolean isTeacher = user.getUserRoles().stream()
                .anyMatch(ur -> ur.getRole().getRoleName() == UserRole.TEACHER);
        if (!isTeacher) {
            throw new InvalidDataException("Người được gán không phải giảng viên");
        }
    }

    private ClassroomSubjectResponse toResponse(ClassroomSubject cs) {
        Subject s = cs.getSubject();
        UserAccount l = cs.getLecturer();
        int studentCount = classroomSubjectStudentRepository.findAllByClassroomSubjectId(cs.getId()).size();
        return ClassroomSubjectResponse.builder()
                .classroomSubjectId(cs.getId())
                .classroomId(cs.getClassroom().getClassroomId())
                .className(cs.getClassroom().getClassName())
                .subjectId(s.getSubjectId())
                .subjectCode(s.getSubjectCode())
                .subjectName(s.getSubjectName())
                .lecturerId(l.getUserId())
                .lecturerName(l.getFirstName() + " " + l.getLastName())
                .displayName(cs.getClassroom().getClassName() + " - " + s.getSubjectCode())
                .studentCount(studentCount)
                .build();
    }
}
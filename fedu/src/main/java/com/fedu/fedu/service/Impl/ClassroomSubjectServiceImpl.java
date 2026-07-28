package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AddClassroomSubjectRequest;
import com.fedu.fedu.dto.res.ClassroomSubjectResponse;
import com.fedu.fedu.entity.Classroom;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.entity.Subject;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomRepository;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.LearningPathRepository;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.repository.SubjectRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.ClassroomSubjectService;
import com.fedu.fedu.utils.NodeRoutingUtils;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import com.fedu.fedu.utils.enums.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
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
    private final LearningPathRepository learningPathRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;

    @Override
    @Transactional
    public ClassroomSubjectResponse addSubjectToClassroom(Long classroomId, AddClassroomSubjectRequest req) {
        Classroom classroom = classroomRepository.findByClassroomIdAndIsDeletedFalse(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found with id: " + classroomId));
        com.fedu.fedu.utils.ClassroomGuards.assertOpen(classroom);
        Subject subject = subjectRepository.findBySubjectIdAndIsDeletedFalse(req.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found with id: " + req.getSubjectId()));
        UserAccount lecturer = userAccountRepository.findById(req.getLecturerId())
                .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found with id: " + req.getLecturerId()));
        assertIsTeacher(lecturer);

        
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
    @Transactional(readOnly = true)
    public List<ClassroomSubjectResponse> getClassroomSubjectsByStudent(long studentId) {
        return classroomSubjectStudentRepository.findAllByStudentId(studentId)
                .stream().map(css -> {
                    ClassroomSubjectResponse res = toResponse(css.getClassroomSubject());
                    res.setIsSubmentor(css.getIsSubmentor());
                    res.setProgressPercent(computeProgressPercent(css));
                    return res;
                }).collect(Collectors.toList());
    }

    /**
     * % tiến độ lộ trình của học sinh trong một lớp-môn, cùng phép đếm
     * NodeRoutingUtils.progressCounts với student graph và báo cáo giáo viên.
     * null khi lớp-môn chưa publish lộ trình — FE ẩn thanh tiến độ thay vì hiện 0% gây hiểu nhầm.
     */
    private Integer computeProgressPercent(ClassroomSubjectStudent css) {
        LearningPath path = learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(css.getClassroomSubject().getId())
                .orElse(null);
        if (path == null || path.getPublishedAt() == null) {
            return null;
        }
        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        Map<Long, StudentProgressStatus> statusByNode = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(css.getStudent().getUserId(), path.getPathId())
                .stream()
                .collect(Collectors.toMap(p -> p.getLearningNode().getNodeId(), StudentNodeProgress::getStatus,
                        (a, b) -> a));
        int[] counts = NodeRoutingUtils.progressCounts(nodes, statusByNode, css.getCurrentLevel());
        if (counts[1] == 0) {
            return 0;
        }
        return (int) Math.round(counts[0] * 100.0 / counts[1]);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomSubjectResponse> getClassroomSubjectsByLecturer(long lecturerId) {
        return classroomSubjectRepository.findByLecturerId(lecturerId)
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
        com.fedu.fedu.utils.ClassroomGuards.assertOpen(cs);

        int studentCount = classroomSubjectStudentRepository.findAllByClassroomSubjectId(classroomSubjectId).size();
        if (studentCount > 0) {
            throw new InvalidDataException("Không thể xóa môn học này vì đang có " + studentCount + " học sinh tham gia. Vui lòng loại bỏ học sinh khỏi môn trước.");
        }

        classroomSubjectRepository.delete(cs);
        log.info("Removed classroom-subject id: {}", classroomSubjectId);
    }

    
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
        Classroom classroom = cs.getClassroom();
        int studentCount = classroomSubjectStudentRepository.findAllByClassroomSubjectId(cs.getId()).size();
        return ClassroomSubjectResponse.builder()
                .classroomSubjectId(cs.getId())
                .classroomId(classroom.getClassroomId())
                .className(classroom.getClassName())
                .subjectId(s.getSubjectId())
                .subjectCode(s.getSubjectCode())
                .subjectName(s.getSubjectName())
                .lecturerId(l.getUserId())
                .lecturerName(l.getFirstName() + " " + l.getLastName())
                .displayName(classroom.getClassName() + " - " + s.getSubjectCode())
                .studentCount(studentCount)
                .status(classroom.getStatus())
                .term(classroom.getTerm())
                .academicYear(classroom.getAcademicYear())
                .semesterLabel(classroom.semesterLabel())
                .build();
    }
}
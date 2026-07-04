package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.SubMentorStudentAssignmentRequest;
import com.fedu.fedu.dto.res.SubMentorStudentAssignmentResponse;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.SubMentorStudentAssignment;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.SubMentorStudentAssignmentRepository;
import com.fedu.fedu.service.SubMentorService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubMentorServiceImpl implements SubMentorService {

    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final SubMentorStudentAssignmentRepository assignmentRepository;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    /** Lấy lớp-môn và xác nhận giảng viên phụ trách. */
    private ClassroomSubject requireLecturerOwnership(Long classroomSubjectId, Long lecturerId) {
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy lớp-môn với id: " + classroomSubjectId));
        if (cs.getLecturer().getUserId() != lecturerId) {
            throw new AccessDeniedException("Bạn không phải giảng viên phụ trách lớp-môn này");
        }
        return cs;
    }

    /** Lấy CSS và xác nhận nó thuộc đúng lớp-môn. */
    private ClassroomSubjectStudent requireCssInClassroomSubject(Long cssId, Long classroomSubjectId) {
        ClassroomSubjectStudent css = classroomSubjectStudentRepository.findById(cssId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy bản ghi ghi danh với id: " + cssId));
        if (!css.getClassroomSubject().getId().equals(classroomSubjectId)) {
            throw new InvalidDataException("Bản ghi ghi danh không thuộc lớp-môn này");
        }
        return css;
    }

    // ─── SubMentor flag operations ────────────────────────────────────────────

    @Override
    @Transactional
    public void enableSubMentor(Long classroomSubjectId, Long classroomSubjectStudentId, Long lecturerId) {
        requireLecturerOwnership(classroomSubjectId, lecturerId);
        ClassroomSubjectStudent css = requireCssInClassroomSubject(classroomSubjectStudentId, classroomSubjectId);
        css.setIsSubmentor(true);
        classroomSubjectStudentRepository.save(css);
        
        // Xóa học sinh này khỏi danh sách được kèm cặp của các sub-mentor khác
        assignmentRepository.deleteByStudentCss_Id(classroomSubjectStudentId);
        
        log.info("Đã bật cờ sub-mentor cho CSS id={} trong lớp-môn id={}", classroomSubjectStudentId, classroomSubjectId);
    }

    @Override
    @Transactional
    public void disableSubMentor(Long classroomSubjectId, Long classroomSubjectStudentId, Long lecturerId) {
        requireLecturerOwnership(classroomSubjectId, lecturerId);
        ClassroomSubjectStudent css = requireCssInClassroomSubject(classroomSubjectStudentId, classroomSubjectId);
        css.setIsSubmentor(false);
        classroomSubjectStudentRepository.save(css);
        
        // Xóa tất cả các học sinh mà sub-mentor này đang kèm cặp
        assignmentRepository.deleteBySubMentorCss_Id(classroomSubjectStudentId);
        
        log.info("Đã tắt cờ sub-mentor cho CSS id={} trong lớp-môn id={}", classroomSubjectStudentId, classroomSubjectId);
    }

    // ─── Assignment operations ─────────────────────────────────────────────────

    @Override
    @Transactional
    public SubMentorStudentAssignmentResponse createAssignment(Long classroomSubjectId,
                                                               SubMentorStudentAssignmentRequest request,
                                                               Long lecturerId) {
        requireLecturerOwnership(classroomSubjectId, lecturerId);

        ClassroomSubjectStudent subMentorCss = requireCssInClassroomSubject(
                request.getSubMentorCssId(), classroomSubjectId);
        ClassroomSubjectStudent studentCss = requireCssInClassroomSubject(
                request.getStudentCssId(), classroomSubjectId);

        // Kiểm sub-mentor phải có cờ isSubmentor=true
        if (!Boolean.TRUE.equals(subMentorCss.getIsSubmentor())) {
            throw new InvalidDataException("Học sinh với CSS id=" + request.getSubMentorCssId()
                    + " chưa được bật cờ sub-mentor");
        }

        // Sub-mentor không thể kèm cặp một sub-mentor khác cùng lớp
        if (Boolean.TRUE.equals(studentCss.getIsSubmentor())) {
            throw new InvalidDataException("Sub-mentor không thể kèm cặp một sub-mentor khác cùng lớp");
        }

        // Chống tự kèm
        if (request.getSubMentorCssId().equals(request.getStudentCssId())) {
            throw new InvalidDataException("Sub-mentor không thể kèm chính mình");
        }

        // Chống trùng cặp
        if (assignmentRepository.existsBySubMentorCss_IdAndStudentCss_Id(
                request.getSubMentorCssId(), request.getStudentCssId())) {
            throw new InvalidDataException("Cặp (sub-mentor, học sinh) này đã tồn tại");
        }

        SubMentorStudentAssignment assignment = SubMentorStudentAssignment.builder()
                .subMentorCss(subMentorCss)
                .studentCss(studentCss)
                .build();
        assignment = assignmentRepository.save(assignment);
        log.info("Đã tạo assignment id={}: sub-mentor CSS {} kèm student CSS {}",
                assignment.getId(), request.getSubMentorCssId(), request.getStudentCssId());
        return toResponse(assignment);
    }

    @Override
    @Transactional
    public void deleteAssignment(Long classroomSubjectId, Long assignmentId, Long lecturerId) {
        requireLecturerOwnership(classroomSubjectId, lecturerId);
        SubMentorStudentAssignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy assignment id: " + assignmentId));
        // Xác nhận assignment thuộc lớp-môn
        if (!assignment.getSubMentorCss().getClassroomSubject().getId().equals(classroomSubjectId)) {
            throw new InvalidDataException("Assignment này không thuộc lớp-môn id=" + classroomSubjectId);
        }
        assignmentRepository.delete(assignment);
        log.info("Đã xóa assignment id={}", assignmentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SubMentorStudentAssignmentResponse> listAssignments(Long classroomSubjectId, Long lecturerId) {
        requireLecturerOwnership(classroomSubjectId, lecturerId);
        // Lấy tất cả CSS trong lớp-môn, rồi lấy assignment của các CSS đó
        List<ClassroomSubjectStudent> cssList = classroomSubjectStudentRepository
                .findAllByClassroomSubjectId(classroomSubjectId);
        List<Long> cssIds = cssList.stream().map(ClassroomSubjectStudent::getId).collect(Collectors.toList());

        return assignmentRepository.findAll().stream()
                .filter(a -> cssIds.contains(a.getSubMentorCss().getId()))
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ─── Mapper ───────────────────────────────────────────────────────────────

    private SubMentorStudentAssignmentResponse toResponse(SubMentorStudentAssignment a) {
        var mentor = a.getSubMentorCss().getStudent();
        var student = a.getStudentCss().getStudent();
        return SubMentorStudentAssignmentResponse.builder()
                .id(a.getId())
                .subMentorCssId(a.getSubMentorCss().getId())
                .subMentorName(mentor.getLastName() + " " + mentor.getFirstName())
                .subMentorEmail(mentor.getEmail())
                .studentCssId(a.getStudentCss().getId())
                .studentName(student.getLastName() + " " + student.getFirstName())
                .studentEmail(student.getEmail())
                .assignedAt(a.getAssignedAt())
                .build();
    }
}

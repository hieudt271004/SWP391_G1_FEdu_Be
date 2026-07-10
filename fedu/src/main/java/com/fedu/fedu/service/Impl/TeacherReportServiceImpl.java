package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.res.StudentProgressReportResponse;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.LearningPathRepository;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.service.TeacherReportService;
import com.fedu.fedu.utils.enums.NodeTestKind;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherReportServiceImpl implements TeacherReportService {

    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final LearningPathRepository learningPathRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;

    @Override
    @Transactional(readOnly = true)
    public List<StudentProgressReportResponse> getProgressReport(Long classroomSubjectId, Long teacherId) {
        // Endpoint teacher-only (controller đã chặn role); admin cần xem thì thêm endpoint /classrooms riêng
        if (!classroomSubjectRepository.existsByIdAndLecturerUserId(classroomSubjectId, teacherId)) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }

        List<ClassroomSubjectStudent> enrollments =
                classroomSubjectStudentRepository.findAllByClassroomSubjectIdWithStudent(classroomSubjectId);
        if (enrollments.isEmpty()) {
            return List.of();
        }

        LearningPath path = learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                .orElse(null);

        // Chưa có lộ trình / chưa publish → trả row toàn 0 cho từng học sinh để bảng FE hiển thị đồng nhất
        Map<Long, List<StudentNodeProgress>> progressByCss;
        if (path == null || path.getPublishedAt() == null) {
            progressByCss = Map.of();
        } else {
            progressByCss = studentNodeProgressRepository.findByLearningPathPathId(path.getPathId())
                    .stream()
                    .collect(Collectors.groupingBy(p -> p.getClassroomSubjectStudent().getId()));
        }

        return enrollments.stream()
                .map(css -> buildRow(css, progressByCss.getOrDefault(css.getId(), List.of())))
                .sorted(Comparator.comparing(StudentProgressReportResponse::getFullName,
                        String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    private StudentProgressReportResponse buildRow(ClassroomSubjectStudent css, List<StudentNodeProgress> rows) {
        Integer level = css.getCurrentLevel();

        // Chỉ tính node học sinh thực sự thấy trên lộ trình: đúng mức (hoặc chung), không tính PLACEMENT
        // (PLACEMENT được auto-COMPLETED lúc seed, node khác mức bị LOCKED vĩnh viễn — đều là nhiễu)
        List<StudentNodeProgress> visible = rows.stream()
                .filter(p -> p.getLearningNode().getTestKind() != NodeTestKind.PLACEMENT)
                .filter(p -> p.getLearningNode().getLevel() == null
                        || p.getLearningNode().getLevel().equals(level))
                .collect(Collectors.toList());
        int totalNodes = visible.size();
        int completedNodes = (int) visible.stream()
                .filter(p -> p.getStatus() == StudentProgressStatus.COMPLETED)
                .count();

        List<StudentProgressReportResponse.LateNodeItem> lateNodes = rows.stream()
                .filter(p -> Boolean.TRUE.equals(p.getCompletedLate()))
                .filter(p -> p.getLearningNode().getTestKind() != NodeTestKind.PLACEMENT)
                .sorted(Comparator.comparing(p -> p.getLearningNode().getDeadlineAt(),
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(p -> StudentProgressReportResponse.LateNodeItem.builder()
                        .nodeId(p.getLearningNode().getNodeId())
                        .title(p.getLearningNode().getTitle())
                        .deadlineAt(p.getLearningNode().getDeadlineAt())
                        .completedAt(p.getCompletedAt())
                        .build())
                .collect(Collectors.toList());

        String lastName = css.getStudent().getLastName() != null ? css.getStudent().getLastName() : "";
        String firstName = css.getStudent().getFirstName() != null ? css.getStudent().getFirstName() : "";
        String fullName = (lastName + " " + firstName).trim();
        if (fullName.isEmpty()) {
            fullName = "Student " + css.getStudent().getUserId();
        }

        return StudentProgressReportResponse.builder()
                .studentId(css.getStudent().getUserId())
                .classroomSubjectStudentId(css.getId())
                .fullName(fullName)
                .email(css.getStudent().getEmail())
                .avatarUrl(css.getStudent().getAvatarUrl())
                .currentLevel(level)
                .completedNodes(completedNodes)
                .totalNodes(totalNodes)
                .lateCount(lateNodes.size())
                .lateNodes(lateNodes)
                .build();
    }
}

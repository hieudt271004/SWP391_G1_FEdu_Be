package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.PlacementResultResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.dto.res.StudentLevelHistoryResponse;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.service.LevelRoutingService;
import com.fedu.fedu.service.PlacementService;
import com.fedu.fedu.service.StudentTestService;
import com.fedu.fedu.utils.LearningLevels;
import com.fedu.fedu.utils.enums.LevelChangeReason;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PlacementServiceImpl implements PlacementService {

    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final StudentTestService studentTestService;
    private final LevelRoutingService levelRoutingService;
    private final LearningPathService learningPathService;
    private final StudentLevelHistoryRepository studentLevelHistoryRepository;
    private final LearningPathRepository learningPathRepository;
    private final StudentTestAttemptRepository studentTestAttemptRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentTestDetailsResponse getPlacementQuiz(Long classroomSubjectId, Long studentId) {
        requireNotPlacedYet(classroomSubjectId, studentId);
        Test quiz = requirePlacementQuiz(classroomSubjectId);
        return studentTestService.getStudentTestDetails(quiz.getTestId(), studentId);
    }

    @Override
    @Transactional
    public StudentTestAttempt startPlacementAttempt(Long classroomSubjectId, Long studentId) {
        requireNotPlacedYet(classroomSubjectId, studentId);
        Test quiz = requirePlacementQuiz(classroomSubjectId);
        return studentTestService.startTestAttempt(quiz.getTestId(), studentId);
    }

    @Override
    @Transactional
    public PlacementResultResponse submitPlacement(Long classroomSubjectId, Long attemptId,
                                                   Long studentId, AttemptSubmissionRequest request) {
        // 1. Pessimistic lock the ClassroomSubjectStudent row
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubjectIdAndStudentIdForUpdate(classroomSubjectId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Học sinh không thuộc lớp-môn này"));

        if (css.getCurrentLevel() != null) {
            throw new InvalidDataException("Bạn đã hoàn thành bài test phân loại cho lớp-môn này.");
        }

        LearningPath path = learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                .orElseThrow(() -> new InvalidDataException("Lớp-môn chưa có lộ trình. Vui lòng liên hệ giảng viên."));
        if (path.getPublishedAt() == null) {
            throw new InvalidDataException("Lộ trình của lớp-môn chưa được xuất bản. Vui lòng liên hệ giảng viên.");
        }

        Test quiz = requirePlacementQuiz(classroomSubjectId);

        BigDecimal score = studentTestService.submitForGrading(quiz.getTestId(), attemptId, studentId, request);

        Integer level = levelRoutingService.resolveLevel(quiz.getTestId(), score);
        if (level == null) {
            // Default to weak if outside all bands
            log.warn("Placement score {} ngoài mọi band của test {} (cs {}). Mặc định mức {}.",
                    score, quiz.getTestId(), classroomSubjectId, LearningLevels.WEAK);
            level = LearningLevels.WEAK;
        }
        final Integer resolvedLevel = level;

        // Determine if it is a retake by checking if they have prior history
        boolean isRetake = !studentLevelHistoryRepository
                .findByStudentUserIdAndClassroomSubjectIdOrderByChangedAtAsc(studentId, classroomSubjectId)
                .isEmpty();
        LevelChangeReason reason = isRetake ? LevelChangeReason.RETAKE : LevelChangeReason.PLACEMENT;

        levelRoutingService.assignInitialLevel(classroomSubjectId, studentId, resolvedLevel, reason);

        learningPathService.backfillProgressForStudent(classroomSubjectId, studentId);

        return PlacementResultResponse.builder()
                .testId(quiz.getTestId())
                .score(score)
                .assignedLevel(resolvedLevel)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentLevelHistoryResponse> getLevelHistory(
            Long classroomSubjectId, Long studentId) {
        return studentLevelHistoryRepository
                .findByStudentUserIdAndClassroomSubjectIdOrderByChangedAtAsc(studentId, classroomSubjectId)
                .stream()
                .map(h -> StudentLevelHistoryResponse.builder()
                        .id(h.getId())
                        .oldLevel(h.getOldLevel())
                        .newLevel(h.getNewLevel())
                        .reason(h.getReason() != null ? h.getReason().name() : null)
                        .changedAt(h.getChangedAt())
                        .build())
                .toList();
    }

    @Override
    @Transactional
    public void cancelPlacementAttempt(Long classroomSubjectId, Long studentId) {
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubjectIdAndStudentIdForUpdate(classroomSubjectId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Học sinh không thuộc lớp-môn này"));

        learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                .ifPresent(path -> studentNodeProgressRepository
                        .deleteByStudentUserIdAndLearningPathPathId(studentId, path.getPathId()));

        css.setCurrentLevel(null);
        classroomSubjectStudentRepository.save(css);

        // Find the placement test attempts and mark them as CANCELLED
        Test quiz = requirePlacementQuiz(classroomSubjectId);
        List<StudentTestAttempt> attempts = studentTestAttemptRepository
                .findByStudentUserIdAndTestTestId(studentId, quiz.getTestId());
        for (StudentTestAttempt att : attempts) {
            if (com.fedu.fedu.utils.enums.AttemptStatus.SUBMITTED.equals(att.getStatus())
                    || com.fedu.fedu.utils.enums.AttemptStatus.IN_PROGRESS.equals(att.getStatus())) {
                att.setStatus(com.fedu.fedu.utils.enums.AttemptStatus.CANCELLED);
                studentTestAttemptRepository.save(att);
            }
        }
    }

    @Override
    @Transactional
    public void cancelPlacementAttemptForTeacher(Long classroomSubjectId, Long studentId, Long teacherId) {
        if (!classroomSubjectRepository.existsByIdAndLecturerUserId(classroomSubjectId, teacherId)) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
        cancelPlacementAttempt(classroomSubjectId, studentId);
    }

    /** Học sinh phải thuộc lớp-môn và CHƯA được phân mức (currentLevel == null). */
    private void requireNotPlacedYet(Long classroomSubjectId, Long studentId) {
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Học sinh không thuộc lớp-môn này"));
        if (css.getCurrentLevel() != null) {
            throw new InvalidDataException("Bạn đã hoàn thành bài test phân loại cho lớp-môn này.");
        }
    }

    private Test requirePlacementQuiz(Long classroomSubjectId) {
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp-môn không tồn tại"));
        if (cs.getQuizStart() == null) {
            throw new InvalidDataException("Lớp-môn chưa cấu hình bài test phân loại.");
        }
        return cs.getQuizStart();
    }
}

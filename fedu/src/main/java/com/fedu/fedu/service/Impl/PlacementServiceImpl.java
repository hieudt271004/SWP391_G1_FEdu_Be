package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.PlacementResultResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.StudentTestAttempt;
import com.fedu.fedu.entity.Test;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class PlacementServiceImpl implements PlacementService {

    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final StudentTestService studentTestService;
    private final LevelRoutingService levelRoutingService;
    private final LearningPathService learningPathService;
    private final com.fedu.fedu.repository.StudentLevelHistoryRepository studentLevelHistoryRepository;

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
        requireNotPlacedYet(classroomSubjectId, studentId);
        Test quiz = requirePlacementQuiz(classroomSubjectId);

        BigDecimal score = studentTestService.submitForGrading(quiz.getTestId(), attemptId, studentId, request);

        Integer level = levelRoutingService.resolveLevel(quiz.getTestId(), score);
        if (level == null) {
            // Điểm rơi ngoài mọi band do giảng viên cấu hình → mặc định mức yếu, ghi log để rà soát.
            log.warn("Placement score {} ngoài mọi band của test {} (cs {}). Mặc định mức {}.",
                    score, quiz.getTestId(), classroomSubjectId, LearningLevels.WEAK);
            level = LearningLevels.WEAK;
        }

        levelRoutingService.assignInitialLevel(classroomSubjectId, studentId, level, LevelChangeReason.PLACEMENT);
        // Khởi tạo tiến trình học theo mức vừa gán (backfill lọc node nhánh theo currentLevel).
        learningPathService.backfillProgressForStudent(classroomSubjectId, studentId);

        return PlacementResultResponse.builder()
                .testId(quiz.getTestId())
                .score(score)
                .assignedLevel(level)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public java.util.List<com.fedu.fedu.dto.res.StudentLevelHistoryResponse> getLevelHistory(
            Long classroomSubjectId, Long studentId) {
        return studentLevelHistoryRepository
                .findByStudentUserIdAndClassroomSubjectIdOrderByChangedAtAsc(studentId, classroomSubjectId)
                .stream()
                .map(h -> com.fedu.fedu.dto.res.StudentLevelHistoryResponse.builder()
                        .id(h.getId())
                        .oldLevel(h.getOldLevel())
                        .newLevel(h.getNewLevel())
                        .reason(h.getReason() != null ? h.getReason().name() : null)
                        .changedAt(h.getChangedAt())
                        .build())
                .toList();
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

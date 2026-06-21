package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.LevelRoutingService;
import com.fedu.fedu.utils.enums.LevelChangeReason;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LevelRoutingServiceImpl implements LevelRoutingService {

    private final QuizScoreBandRepository quizScoreBandRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final StudentLevelHistoryRepository studentLevelHistoryRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final NodeEdgeRepository nodeEdgeRepository;
    private final LearningPathRepository learningPathRepository;

    @Override
    @Transactional(readOnly = true)
    public Integer resolveLevel(Long testId, BigDecimal percentage) {
        if (percentage == null) {
            return null;
        }
        for (QuizScoreBand band : quizScoreBandRepository.findByTestTestIdOrderByMinScoreAsc(testId)) {
            if (percentage.compareTo(band.getMinScore()) >= 0 && percentage.compareTo(band.getMaxScore()) <= 0) {
                return band.getTargetLevel();
            }
        }
        return null;
    }

    @Override
    @Transactional
    public void assignInitialLevel(Long classroomSubjectId, Long studentId, Integer level, LevelChangeReason reason) {
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Học sinh không thuộc lớp-môn này"));

        Integer old = css.getCurrentLevel();
        css.setCurrentLevel(level);
        classroomSubjectStudentRepository.save(css);
        writeHistory(css, old, level, reason);
    }

    @Override
    @Transactional
    public void applyGateBands(Long classroomSubjectId, Long testId, Long studentId, BigDecimal percentage) {
        Integer newLevel = resolveLevel(testId, percentage);
        if (newLevel == null) {
            // Không có band khớp (test không phải cổng test, hoặc điểm rơi ngoài mọi band) → giữ nguyên mức.
            return;
        }
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElse(null);
        if (css == null) {
            return;
        }
        Integer current = css.getCurrentLevel();
        if (Objects.equals(current, newLevel)) {
            return; // giữ nguyên mức, không ghi lịch sử
        }
        css.setCurrentLevel(newLevel);
        classroomSubjectStudentRepository.save(css);
        writeHistory(css, current, newLevel, LevelChangeReason.GATE);
        reopenBranchNodesForLevel(classroomSubjectId, studentId, newLevel);
    }

    /**
     * Mở lại node nhánh của các chặng chưa hoàn thành theo mức mới:
     * node nhánh khớp mức + đủ điều kiện tiên quyết → OPEN; node nhánh khác mức chưa xong → LOCKED.
     * Node đã COMPLETED và node chung (level == null) giữ nguyên.
     */
    private void reopenBranchNodesForLevel(Long classroomSubjectId, Long studentId, Integer newLevel) {
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElse(null);
        if (css == null || css.getAssignedPath() == null) {
            return;
        }
        LearningPath path = css.getAssignedPath();
        List<StudentNodeProgress> list = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
        Map<Long, StudentProgressStatus> statusByNode = list.stream()
                .collect(Collectors.toMap(p -> p.getLearningNode().getNodeId(),
                        StudentNodeProgress::getStatus, (a, b) -> a));

        for (StudentNodeProgress p : list) {
            LearningNode node = p.getLearningNode();
            if (node.getLevel() == null) {
                continue; // node chung
            }
            if (p.getStatus() == StudentProgressStatus.COMPLETED) {
                continue; // giữ lịch sử đã học
            }
            if (node.getLevel().equals(newLevel)) {
                List<NodeEdge> incoming = nodeEdgeRepository.findByToNodeNodeId(node.getNodeId());
                boolean prereqMet = incoming.isEmpty() || incoming.stream().allMatch(
                        e -> statusByNode.get(e.getFromNode().getNodeId()) == StudentProgressStatus.COMPLETED);
                if (p.getStatus() == StudentProgressStatus.LOCKED && prereqMet) {
                    p.setStatus(StudentProgressStatus.OPEN);
                    p.setUnlockedAt(LocalDateTime.now());
                }
            } else if (p.getStatus() != StudentProgressStatus.LOCKED) {
                // node nhánh khác mức, chưa hoàn thành → khóa lại
                p.setStatus(StudentProgressStatus.LOCKED);
            }
        }
        studentNodeProgressRepository.saveAll(list);
    }

    private void writeHistory(ClassroomSubjectStudent css, Integer oldLevel, Integer newLevel, LevelChangeReason reason) {
        studentLevelHistoryRepository.save(StudentLevelHistory.builder()
                .student(css.getStudent())
                .classroomSubject(css.getClassroomSubject())
                .oldLevel(oldLevel)
                .newLevel(newLevel)
                .reason(reason)
                .build());
    }
}

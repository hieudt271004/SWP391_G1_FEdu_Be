package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.LevelRoutingService;
import com.fedu.fedu.utils.LearningLevels;
import com.fedu.fedu.utils.enums.LevelChangeReason;
import com.fedu.fedu.utils.enums.NodeTestKind;
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
    public void applyGateRouting(Long classroomSubjectId, LearningNode gateNode, Long studentId, BigDecimal percentage) {
        if (gateNode == null || gateNode.getTestKind() != NodeTestKind.GATE) {
            return; // chỉ áp dụng cho node cổng phân luồng
        }
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElse(null);
        if (css == null) {
            return;
        }
        Integer current = css.getCurrentLevel();
        if (current == null) {
            return; // chưa phân loại thì cổng không định tuyến được
        }

        Set<Integer> applies = parseApplies(gateNode.getAppliesLevels());
        if (!applies.isEmpty() && !applies.contains(current)) {
            return; // cổng này không phụ trách mức của học sinh → giữ nguyên
        }
        int minA = applies.isEmpty() ? LearningLevels.MIN : Collections.min(applies);
        int maxA = applies.isEmpty() ? LearningLevels.MAX : Collections.max(applies);

        int newLevel = current;
        BigDecimal up = gateNode.getGateUpMin();
        BigDecimal down = gateNode.getGateDownMax();
        if (up != null && percentage != null && percentage.compareTo(up) >= 0) {
            newLevel = Math.min(current + 1, maxA); // lên 1 bậc, chặn trong applies_levels
        } else if (down != null && percentage != null && percentage.compareTo(down) <= 0) {
            newLevel = Math.max(current - 1, minA); // xuống 1 bậc, chặn trong applies_levels
        }
        // điểm ở giữa (hoặc thiếu ngưỡng) → giữ nguyên mức

        if (current == newLevel) {
            return; // không đổi mức, không ghi lịch sử
        }
        css.setCurrentLevel(newLevel);
        classroomSubjectStudentRepository.save(css);
        writeHistory(css, current, newLevel, LevelChangeReason.GATE);
        reopenBranchNodesForLevel(classroomSubjectId, studentId, newLevel);
    }

    private static Set<Integer> parseApplies(String s) {
        Set<Integer> out = new LinkedHashSet<>();
        if (s == null || s.isBlank()) {
            return out;
        }
        for (String part : s.split(",")) {
            try {
                int v = Integer.parseInt(part.trim());
                if (v >= LearningLevels.MIN && v <= LearningLevels.MAX) {
                    out.add(v);
                }
            } catch (NumberFormatException ignored) {
                // bỏ qua phần không phải số
            }
        }
        return out;
    }

    private void reopenBranchNodesForLevel(Long classroomSubjectId, Long studentId, Integer newLevel) {
        LearningPath path = learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                .orElse(null);
        if (path == null) {
            return;
        }
        List<StudentNodeProgress> list = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
        Map<Long, StudentProgressStatus> statusByNode = list.stream()
                .collect(Collectors.toMap(p -> p.getLearningNode().getNodeId(),
                        StudentNodeProgress::getStatus, (a, b) -> a));

        for (StudentNodeProgress p : list) {
            LearningNode node = p.getLearningNode();
            if (node.getTestKind() != null && node.getTestKind() != NodeTestKind.NONE) {
                continue; // node test — mở theo tiên quyết, không theo mức
            }
            if (node.getLevel() == null) {
                continue; // node học chung
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

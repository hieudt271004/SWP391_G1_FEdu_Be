package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.LevelRoutingService;
import com.fedu.fedu.utils.LearningLevels;
import com.fedu.fedu.utils.NodeRoutingUtils;
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
    private final TestRepository testRepository;

    
    private static final BigDecimal DEFAULT_YEU_MAX = BigDecimal.valueOf(40);
    private static final BigDecimal DEFAULT_TB_MAX = BigDecimal.valueOf(70);

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

        

        Test test = testRepository.findById(testId).orElse(null);
        LearningNode node = test != null ? test.getLearningNode() : null;
        if (node != null && node.getTestKind() == NodeTestKind.PLACEMENT) {
            return resolveByPlacementThresholds(node, percentage);
        }
        return null;
    }

    private Integer resolveByPlacementThresholds(LearningNode node, BigDecimal percentage) {
        BigDecimal yeuMax = node.getPlacementYeuMax() != null ? node.getPlacementYeuMax() : DEFAULT_YEU_MAX;
        BigDecimal tbMax = node.getPlacementTbMax() != null ? node.getPlacementTbMax() : DEFAULT_TB_MAX;
        if (node.getPlacementYeuMax() == null || node.getPlacementTbMax() == null) {
            log.warn("Node PLACEMENT {} thiếu ngưỡng phân mức — dùng mặc định {}/{}.",
                    node.getNodeId(), DEFAULT_YEU_MAX, DEFAULT_TB_MAX);
        }
        if (percentage.compareTo(yeuMax) <= 0) {
            return LearningLevels.WEAK;
        }
        if (percentage.compareTo(tbMax) <= 0) {
            return LearningLevels.MEDIUM;
        }
        return LearningLevels.GOOD;
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
            return; 
        }
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElse(null);
        if (css == null) {
            return;
        }
        Integer current = css.getCurrentLevel();
        if (current == null) {
            return; 
        }

        Set<Integer> applies = parseApplies(gateNode.getAppliesLevels());
        if (!applies.isEmpty() && !applies.contains(current)) {
            return; 
        }
        int minA = applies.isEmpty() ? LearningLevels.MIN : Collections.min(applies);
        int maxA = applies.isEmpty() ? LearningLevels.MAX : Collections.max(applies);

        int newLevel = current;
        BigDecimal up = gateNode.getGateUpMin();
        BigDecimal down = gateNode.getGateDownMax();
        if (up != null && percentage != null && percentage.compareTo(up) >= 0) {
            newLevel = Math.min(current + 1, maxA); 
        } else if (down != null && percentage != null && percentage.compareTo(down) <= 0) {
            newLevel = Math.max(current - 1, minA); 
        }
        

        if (current == newLevel) {
            return; 
        }
        css.setCurrentLevel(newLevel);
        classroomSubjectStudentRepository.save(css);
        writeHistory(css, current, newLevel, LevelChangeReason.GATE);
        reopenBranchNodesForLevel(classroomSubjectId, studentId, newLevel);
    }

    @Override
    @Transactional
    public void applyFreeChoiceRouting(Long classroomSubjectId, LearningNode freeChoiceNode, Long studentId) {
        if (freeChoiceNode == null || freeChoiceNode.getTestKind() != NodeTestKind.FREE_CHOICE) {
            return; 
        }
        Integer target = freeChoiceNode.getLevel();
        if (!LearningLevels.isValid(target)) {
            return; 
        }
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElse(null);
        if (css == null) {
            return;
        }
        Integer current = css.getCurrentLevel();
        if (Objects.equals(current, target)) {
            return; 
        }
        css.setCurrentLevel(target);
        classroomSubjectStudentRepository.save(css);
        writeHistory(css, current, target, LevelChangeReason.FREE_CHOICE);
        reopenBranchNodesForLevel(classroomSubjectId, studentId, target);
    }

    @Override
    @Transactional
    public void applyPlacementRetakeRouting(Long classroomSubjectId, LearningNode placementNode, Long studentId,
                                            Long testId, BigDecimal percentage) {
        if (placementNode == null || placementNode.getTestKind() != NodeTestKind.PLACEMENT || percentage == null) {
            return;
        }
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElse(null);
        if (css == null) {
            return;
        }
        Integer current = css.getCurrentLevel();
        if (current == null) {
            return;
        }

        Set<Integer> applies = parseApplies(placementNode.getAppliesLevels());
        if (!applies.isEmpty() && !applies.contains(current)) {
            return;
        }

        Integer newLevel = testId != null ? resolveLevel(testId, percentage) : null;
        if (newLevel == null) {
            newLevel = resolveByPlacementThresholds(placementNode, percentage);
        }
        if (newLevel == null || current.equals(newLevel)) {
            return;
        }
        css.setCurrentLevel(newLevel);
        classroomSubjectStudentRepository.save(css);
        writeHistory(css, current, newLevel, LevelChangeReason.RETAKE);
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


        Set<Integer> stagesDoneAtOtherLevel = list.stream()
                .filter(p -> p.getStatus() == StudentProgressStatus.COMPLETED)
                .map(StudentNodeProgress::getLearningNode)
                .filter(n -> (n.getTestKind() == null || n.getTestKind() == NodeTestKind.NONE)
                        && n.getLevel() != null && !n.getLevel().equals(newLevel)
                        && n.getStageOrder() != null)
                .map(LearningNode::getStageOrder)
                .collect(Collectors.toSet());

        for (StudentNodeProgress p : list) {
            LearningNode node = p.getLearningNode();
            if (node.getTestKind() != null && node.getTestKind() != NodeTestKind.NONE) {
                continue;
            }
            if (node.getLevel() == null) {
                continue;
            }
            if (p.getStatus() == StudentProgressStatus.COMPLETED) {
                continue;
            }
            if (node.getLevel().equals(newLevel)) {

                if (stagesDoneAtOtherLevel.contains(node.getStageOrder())) {
                    continue;
                }
                List<NodeEdge> incoming = nodeEdgeRepository.findByToNodeNodeId(node.getNodeId());
                boolean prereqMet = NodeRoutingUtils.incomingPrereqMet(incoming, statusByNode, newLevel);
                if (p.getStatus() == StudentProgressStatus.LOCKED && prereqMet) {
                    p.setStatus(StudentProgressStatus.OPEN);
                    p.setUnlockedAt(LocalDateTime.now());
                }
            } else if (p.getStatus() != StudentProgressStatus.LOCKED) {

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

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
        reopenBranchNodesForLevel(classroomSubjectId, studentId, newLevel, gateNode.getStageOrder());
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
        reopenBranchNodesForLevel(classroomSubjectId, studentId, target, freeChoiceNode.getStageOrder());
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
        reopenBranchNodesForLevel(classroomSubjectId, studentId, newLevel, placementNode.getStageOrder());
    }

    private static Set<Integer> parseApplies(String s) {
        return NodeRoutingUtils.parseAppliesLevels(s);
    }

    @Override
    @Transactional
    public void reopenBranchNodesForLevel(Long classroomSubjectId, Long studentId, Integer newLevel, Integer fromStage) {
        LearningPath path = learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                .orElse(null);
        if (path == null) {
            return;
        }
        List<StudentNodeProgress> list = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());

        Set<Integer> stagesDoneAtOtherLevel = NodeRoutingUtils.stagesClearedAtOtherLevel(list, newLevel);
        Set<Integer> fcChosenStages = NodeRoutingUtils.stagesWithChosenFreeChoice(list);

        // Chốt vị trí: không mở node ở chặng phía sau lưng học sinh (nhánh mới tiếp tục từ chỗ đang đứng).
        int floorStage = NodeRoutingUtils.maxCompletedAtHomeStage(list);
        if (fromStage != null && fromStage > floorStage) {
            floorStage = fromStage;
        }


        for (StudentNodeProgress p : list) {
            LearningNode node = p.getLearningNode();
            if (node.getLevel() == null
                    || node.getLevel().equals(newLevel)
                    || node.getTestKind() == NodeTestKind.FREE_CHOICE
                    || p.getStatus() == StudentProgressStatus.COMPLETED) {
                continue;
            }
            if (p.getStatus() != StudentProgressStatus.LOCKED) {
                p.setStatus(StudentProgressStatus.LOCKED);
            }
        }

        // Run fixed-point graph unlocking propagation to unlock the new level's starting frontier
        List<NodeEdge> pathEdges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
        Map<Long, List<NodeEdge>> incomingByNode = new HashMap<>();
        for (NodeEdge e : pathEdges) {
            incomingByNode.computeIfAbsent(e.getToNode().getNodeId(), k -> new ArrayList<>()).add(e);
        }

        boolean progressChanged = true;
        while (progressChanged) {
            progressChanged = false;
            Map<Long, StudentProgressStatus> currentStatusMap = list.stream()
                    .collect(Collectors.toMap(p -> p.getLearningNode().getNodeId(), StudentNodeProgress::getStatus, (a, b) -> a));

            for (StudentNodeProgress p : list) {
                if (p.getStatus() == StudentProgressStatus.LOCKED) {
                    LearningNode node = p.getLearningNode();
                    if (!NodeRoutingUtils.unlockableAtLevel(node, newLevel)) continue;

                    if (node.getTestKind() != NodeTestKind.FREE_CHOICE
                            && node.getStageOrder() != null && node.getStageOrder() < floorStage) {
                        continue;
                    }

                    // Đã chọn một bài tự chọn ở chặng này thì các bài tự chọn còn lại đóng hẳn.
                    if (node.getTestKind() == NodeTestKind.FREE_CHOICE
                            && node.getStageOrder() != null && fcChosenStages.contains(node.getStageOrder())) {
                        continue;
                    }

                    if (NodeRoutingUtils.alreadyClearedAtOtherLevel(node, stagesDoneAtOtherLevel)) {
                        continue;
                    }

                    boolean prereqMet = NodeRoutingUtils.prereqMetThroughOnClass(
                            node.getNodeId(),
                            id -> incomingByNode.getOrDefault(id, Collections.emptyList()),
                            currentStatusMap, newLevel, list);

                    if (prereqMet && (node.getNodeType() != com.fedu.fedu.utils.enums.NodeType.ON_CLASS || node.getStatus() == com.fedu.fedu.utils.enums.NodeStatus.OPEN)) {
                        p.setStatus(StudentProgressStatus.OPEN);
                        p.setUnlockedAt(LocalDateTime.now());
                        progressChanged = true;
                    }
                }
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

package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.StudentProgressService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import com.fedu.fedu.utils.enums.NodeType;
import com.fedu.fedu.utils.enums.NodeStatus;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentProgressServiceImpl implements StudentProgressService {

    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final LearningPathRepository learningPathRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final NodeEdgeRepository nodeEdgeRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final NodeMaterialRepository nodeMaterialRepository;
    private final StudentMaterialProgressRepository studentMaterialProgressRepository;
    private final StudentTestAttemptRepository studentTestAttemptRepository;

    @Override
    @Transactional
    public ClassroomGraphResponse getStudentClassroomGraph(Long classroomSubjectId, Long studentId) {
        
        ClassroomSubjectStudent enrollment = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Học sinh không thuộc lớp-môn này"));

        
        
        
        LearningPath path = learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                .orElse(null);
        if (path == null || path.getPublishedAt() == null) {
            
            return ClassroomGraphResponse.builder()
                    .classroomSubjectId(classroomSubjectId)
                    .state("NO_PATH")
                    .pathId(null)
                    .publishedAt(null)
                    .nodes(Collections.emptyList())
                    .edges(Collections.emptyList())
                    .availableTemplates(Collections.emptyList())
                    .build();
        }

        if (enrollment.getCurrentLevel() == null) {
            
            
            com.fedu.fedu.entity.Test quizStart = enrollment.getClassroomSubject().getQuizStart();
            boolean pendingReview = quizStart != null && studentTestAttemptRepository
                    .findByStudentUserIdAndTestTestId(studentId, quizStart.getTestId())
                    .stream()
                    .anyMatch(a -> a.getStatus() == com.fedu.fedu.utils.enums.AttemptStatus.PENDING_REVIEW);
            return ClassroomGraphResponse.builder()
                    .classroomSubjectId(classroomSubjectId)
                    .state(pendingReview ? "PLACEMENT_PENDING" : "NEED_PLACEMENT")
                    .pathId(null)
                    .publishedAt(null)
                    .nodes(Collections.emptyList())
                    .edges(Collections.emptyList())
                    .availableTemplates(Collections.emptyList())
                    .build();
        }

        Integer level = enrollment.getCurrentLevel();

        List<LearningNode> allNodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        LearningNode entryPlacement = com.fedu.fedu.utils.NodeRoutingUtils.entryPlacementNode(allNodes);
        Long entryPlacementId = entryPlacement != null ? entryPlacement.getNodeId() : null;

        List<StudentNodeProgress> progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());

        boolean healed = false;
        boolean onClassHealed = false;
        for (StudentNodeProgress p : progressList) {
            LearningNode n = p.getLearningNode();
            if (n.getNodeType() == NodeType.ON_CLASS && p.getStatus() != StudentProgressStatus.COMPLETED) {
                boolean passed = n.getSessionEndedAt() != null || 
                        (n.getStudyDate() != null && n.getSlot() != null && 
                         java.time.LocalDateTime.of(n.getStudyDate(), n.getSlot().getEndTime()).isBefore(java.time.LocalDateTime.now()));
                if (passed) {
                    p.setStatus(StudentProgressStatus.COMPLETED);
                    p.setCompletedAt(java.time.LocalDateTime.now());
                    studentNodeProgressRepository.save(p);
                    onClassHealed = true;
                }
            }
        }
        if (onClassHealed) {
            progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
        }

        List<StudentNodeProgress> incompletePlacements = progressList.stream()
                .filter(p -> p.getLearningNode().getNodeId().equals(entryPlacementId)
                        && p.getStatus() != StudentProgressStatus.COMPLETED)
                .collect(Collectors.toList());

        if (!incompletePlacements.isEmpty()) {
            for (StudentNodeProgress p : incompletePlacements) {
                p.setStatus(StudentProgressStatus.COMPLETED);
                p.setCompletedAt(java.time.LocalDateTime.now());
                studentNodeProgressRepository.save(p);
                healed = true;
            }
        }

        // Chốt chặn: khóa lại node theo mức đang OPEN/IN_PROGRESS nhưng chặng của nó học sinh đã
        // hoàn thành ở mức khác. Đây là các node từng bị mở sai (trước khi guard ở
        // openMainTargetIfEligible được thêm); recompute chỉ mở LOCKED→OPEN nên không tự sửa được,
        // phải khóa lại chủ động. KHÔNG đụng node COMPLETED để tránh khóa nhầm chặng đã clear.
        {
            Set<Integer> stagesClearedOther =
                    com.fedu.fedu.utils.NodeRoutingUtils.stagesClearedAtOtherLevel(progressList, level);
            boolean relocked = false;
            for (StudentNodeProgress p : progressList) {
                if (p.getStatus() != StudentProgressStatus.OPEN
                        && p.getStatus() != StudentProgressStatus.IN_PROGRESS) continue;
                if (com.fedu.fedu.utils.NodeRoutingUtils.alreadyClearedAtOtherLevel(
                        p.getLearningNode(), stagesClearedOther)) {
                    p.setStatus(StudentProgressStatus.LOCKED);
                    p.setUnlockedAt(null);
                    studentNodeProgressRepository.save(p);
                    relocked = true;
                }
            }
            if (relocked) {
                healed = true;
                progressList = studentNodeProgressRepository
                        .findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
            }
        }

        // Run fixed-point graph unlocking propagation to unlock all reachable nodes whose prerequisites are completed.
        List<NodeEdge> pathEdges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
        Map<Long, List<NodeEdge>> incomingByNode = new HashMap<>();
        for (NodeEdge e : pathEdges) {
            incomingByNode.computeIfAbsent(e.getToNode().getNodeId(), k -> new ArrayList<>()).add(e);
        }

        boolean progressChanged = true;
        while (progressChanged) {
            progressChanged = false;
            Map<Long, StudentProgressStatus> currentStatusMap = progressList.stream()
                    .collect(Collectors.toMap(p -> p.getLearningNode().getNodeId(), StudentNodeProgress::getStatus, (a, b) -> a));
            Set<Integer> stagesDoneAtOtherLevel =
                    com.fedu.fedu.utils.NodeRoutingUtils.stagesClearedAtOtherLevel(progressList, level);
            int floorStage = com.fedu.fedu.utils.NodeRoutingUtils.maxCompletedAtHomeStage(progressList);
            Set<Integer> fcChosenStages =
                    com.fedu.fedu.utils.NodeRoutingUtils.stagesWithChosenFreeChoice(progressList);

            for (StudentNodeProgress p : progressList) {
                if (p.getStatus() == StudentProgressStatus.LOCKED) {
                    LearningNode node = p.getLearningNode();
                    if (!com.fedu.fedu.utils.NodeRoutingUtils.unlockableAtLevel(node, level)) continue;

                    if (node.getTestKind() != com.fedu.fedu.utils.enums.NodeTestKind.FREE_CHOICE
                            && node.getStageOrder() != null && node.getStageOrder() < floorStage) {
                        continue;
                    }

                    if (node.getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.FREE_CHOICE
                            && node.getStageOrder() != null && fcChosenStages.contains(node.getStageOrder())) {
                        continue;
                    }

                    if (com.fedu.fedu.utils.NodeRoutingUtils.alreadyClearedAtOtherLevel(node, stagesDoneAtOtherLevel)) {
                        continue;
                    }

                    boolean prereqMet = com.fedu.fedu.utils.NodeRoutingUtils.prereqMetThroughOnClass(
                            node.getNodeId(),
                            id -> incomingByNode.getOrDefault(id, Collections.emptyList()),
                            currentStatusMap, level, progressList);

                    if (prereqMet && (node.getNodeType() != NodeType.ON_CLASS || node.getStatus() == NodeStatus.OPEN)) {
                        p.setStatus(StudentProgressStatus.OPEN);
                        p.setUnlockedAt(java.time.LocalDateTime.now());
                        studentNodeProgressRepository.save(p);
                        healed = true;
                        progressChanged = true;
                    }
                }
            }
        }

        if (healed) {
            progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
        }

        Map<Long, StudentNodeProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(
                        p -> p.getLearningNode().getNodeId(),
                        p -> p,
                        (a, b) -> a
                ));


        healOnClassBlockedNodes(path, level, progressList);


        List<LearningNode> nodes = allNodes;
        Set<Long> visibleNodeIds = nodes.stream().map(LearningNode::getNodeId).collect(Collectors.toSet());
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId())
                .stream()
                .filter(e -> visibleNodeIds.contains(e.getFromNode().getNodeId())
                        && visibleNodeIds.contains(e.getToNode().getNodeId()))
                .collect(Collectors.toList());

        List<LearningNodeResponse> nodeResponses = nodes.stream()
                .map(n -> {
                    StudentNodeProgress progress = progressMap.get(n.getNodeId());
                    String studentStatus = progress != null ? progress.getStatus().name() : "LOCKED";
                    return LearningNodeResponse.builder()
                            .nodeId(n.getNodeId())
                            .learningPathId(path.getPathId())
                            .title(n.getTitle())
                            .description(n.getDescription())
                            .nodeType(n.getNodeType())
                            .status(n.getStatus())
                            .studentStatus(studentStatus)
                            .displayOrder(n.getDisplayOrder())
                            .isRequired(n.getIsRequired())
                            .isDeleted(n.getIsDeleted())
                            
                            
                            .stageOrder(n.getStageOrder())
                            .level(n.getLevel())
                            .testKind(n.getTestKind())
                            .appliesLevels(n.getAppliesLevels())
                            .gateUpMin(n.getGateUpMin())
                            .gateDownMax(n.getGateDownMax())
                            .placementYeuMax(n.getPlacementYeuMax())
                            .placementTbMax(n.getPlacementTbMax())
                            .studyDate(n.getStudyDate())
                            .slotId(n.getSlot() != null ? n.getSlot().getSlotId() : null)
                            .slotName(n.getSlot() != null ? n.getSlot().getSlotName() : null)
                            .startTime(n.getSlot() != null ? n.getSlot().getStartTime() : null)
                            .endTime(n.getSlot() != null ? n.getSlot().getEndTime() : null)
                            .deadlineAt(n.getDeadlineAt())
                            .completedLate(progress != null && Boolean.TRUE.equals(progress.getCompletedLate()))
                            .createdAt(n.getCreatedAt())
                            .updatedAt(n.getUpdatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        List<NodeEdgeResponse> edgeResponses = edges.stream()
                .map(e -> NodeEdgeResponse.builder()
                        .edgeId(e.getEdgeId())
                        .fromNodeId(e.getFromNode().getNodeId())
                        .toNodeId(e.getToNode().getNodeId())
                        .build())
                .collect(Collectors.toList());


        // Đếm theo NODE bằng quy tắc dùng chung với báo cáo giáo viên (NodeRoutingUtils.progressCounts):
        // mỗi chặng tính theo nhánh học sinh đã đi, nên chuyển mức không làm tiến độ sụt ảo.
        Map<Long, StudentProgressStatus> statusByNode = progressMap.entrySet().stream()
                .collect(Collectors.toMap(Map.Entry::getKey, e -> e.getValue().getStatus()));
        int[] progressCounts = com.fedu.fedu.utils.NodeRoutingUtils.progressCounts(nodes, statusByNode, level);
        int completedNodes = progressCounts[0];
        int totalNodes = progressCounts[1];

        return ClassroomGraphResponse.builder()
                .classroomSubjectId(classroomSubjectId)
                .state("PUBLISHED")
                .pathId(path.getPathId())
                .publishedAt(path.getPublishedAt())
                .nodes(nodeResponses)
                .edges(edgeResponses)
                .availableTemplates(null)
                .totalNodes(totalNodes)
                .completedNodes(completedNodes)
                .build();
    }





    private void healOnClassBlockedNodes(LearningPath path, Integer level, List<StudentNodeProgress> progressList) {
        List<NodeEdge> allEdges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
        Map<Long, List<NodeEdge>> incomingByNode = new HashMap<>();
        for (NodeEdge e : allEdges) {
            incomingByNode.computeIfAbsent(e.getToNode().getNodeId(), k -> new ArrayList<>()).add(e);
        }
        Map<Long, StudentProgressStatus> statusByNode = progressList.stream()
                .collect(Collectors.toMap(p -> p.getLearningNode().getNodeId(),
                        StudentNodeProgress::getStatus, (a, b) -> a));

        Set<Integer> stagesDoneAtOtherLevel =
                com.fedu.fedu.utils.NodeRoutingUtils.stagesClearedAtOtherLevel(progressList, level);
        int floorStage = com.fedu.fedu.utils.NodeRoutingUtils.maxCompletedAtHomeStage(progressList);
        Set<Integer> fcChosenStages =
                com.fedu.fedu.utils.NodeRoutingUtils.stagesWithChosenFreeChoice(progressList);

        for (StudentNodeProgress p : progressList) {
            LearningNode n = p.getLearningNode();
            if (p.getStatus() != StudentProgressStatus.LOCKED) continue;
            if (n.getNodeType() == NodeType.ON_CLASS) continue;
            if (!com.fedu.fedu.utils.NodeRoutingUtils.unlockableAtLevel(n, level)) continue;

            if (n.getTestKind() != com.fedu.fedu.utils.enums.NodeTestKind.FREE_CHOICE
                    && n.getStageOrder() != null && n.getStageOrder() < floorStage) {
                continue;
            }

            if (n.getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.FREE_CHOICE
                    && n.getStageOrder() != null && fcChosenStages.contains(n.getStageOrder())) {
                continue;
            }

            if (com.fedu.fedu.utils.NodeRoutingUtils.alreadyClearedAtOtherLevel(n, stagesDoneAtOtherLevel)) {
                continue;
            }


            boolean hasOnClassParent = incomingByNode.getOrDefault(n.getNodeId(), Collections.emptyList())
                    .stream().anyMatch(e -> e.getFromNode().getNodeType() == NodeType.ON_CLASS);
            if (!hasOnClassParent) continue;

            boolean prereqMet = com.fedu.fedu.utils.NodeRoutingUtils.prereqMetThroughOnClass(
                    n.getNodeId(),
                    id -> incomingByNode.getOrDefault(id, Collections.emptyList()),
                    statusByNode, level, progressList);
            if (prereqMet) {
                p.setStatus(StudentProgressStatus.OPEN);
                p.setUnlockedAt(java.time.LocalDateTime.now());
                studentNodeProgressRepository.save(p);
            }
        }
    }

    @Override
    @Transactional
    public void markMaterialAsCompleted(Long materialId, Long studentId) {
        NodeMaterial material = nodeMaterialRepository.findById(materialId)
                .orElseThrow(() -> new com.fedu.fedu.exception.ResourceNotFoundException("Material không tồn tại: " + materialId));

        Long classroomSubjectId = material.getLearningNode().getLearningPath().getClassroomSubject().getId();

        ClassroomSubjectStudent enrollment = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Học sinh chưa ghi danh vào lớp/môn này"));

        if (!studentMaterialProgressRepository.existsByEnrollmentAndMaterial(enrollment.getId(), materialId)) {
            StudentMaterialProgress progress = StudentMaterialProgress.builder()
                    .classroomSubjectStudent(enrollment)
                    .material(material)
                    .completedAt(java.time.LocalDateTime.now())
                    .build();
            studentMaterialProgressRepository.save(progress);
        }
    }

    @Override
    public List<Long> getCompletedMaterialIds(Long studentId) {
        return studentMaterialProgressRepository.findCompletedMaterialIdsByStudentId(studentId);
    }
}

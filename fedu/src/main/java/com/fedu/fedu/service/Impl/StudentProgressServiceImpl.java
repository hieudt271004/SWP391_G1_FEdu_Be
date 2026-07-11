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
    private final NodeExerciseRepository nodeExerciseRepository;
    private final SubmissionRepository submissionRepository;
    private final TestRepository testRepository;
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
        List<StudentNodeProgress> incompletePlacements = progressList.stream()
                .filter(p -> p.getLearningNode().getNodeId().equals(entryPlacementId)
                        && p.getStatus() != StudentProgressStatus.COMPLETED)
                .collect(Collectors.toList());

        if (!incompletePlacements.isEmpty()) {
            Set<Long> placementNodeIds = incompletePlacements.stream()
                    .map(p -> p.getLearningNode().getNodeId())
                    .collect(Collectors.toSet());

            for (StudentNodeProgress p : incompletePlacements) {
                p.setStatus(StudentProgressStatus.COMPLETED);
                p.setCompletedAt(java.time.LocalDateTime.now());
                studentNodeProgressRepository.save(p);
                healed = true;
            }


            List<NodeEdge> pathEdges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
            for (StudentNodeProgress p : progressList) {
                if (p.getStatus() == StudentProgressStatus.LOCKED) {
                    LearningNode node = p.getLearningNode();
                    boolean levelOk = node.getLevel() == null || node.getLevel().equals(level)
                            || node.getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.FREE_CHOICE;

                    List<Long> incomingNodeIds = pathEdges.stream()
                            .filter(e -> e.getToNode().getNodeId().equals(node.getNodeId()))
                            .map(e -> e.getFromNode().getNodeId())
                            .collect(Collectors.toList());

                    boolean isPrereqMet = !incomingNodeIds.isEmpty() && placementNodeIds.containsAll(incomingNodeIds);

                    if (isPrereqMet && levelOk && (node.getNodeType() != NodeType.ON_CLASS || node.getStatus() == NodeStatus.OPEN)) {
                        p.setStatus(StudentProgressStatus.OPEN);
                        p.setUnlockedAt(java.time.LocalDateTime.now());
                        studentNodeProgressRepository.save(p);
                        healed = true;
                    }
                }
            }


            if (healed) {
                progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
            }
        }

        Map<Long, StudentNodeProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(
                        p -> p.getLearningNode().getNodeId(),
                        p -> p,
                        (a, b) -> a
                ));


        Set<Integer> stagesDoneAtOtherLevel = allNodes.stream()
                .filter(n -> {
                    StudentNodeProgress p = progressMap.get(n.getNodeId());
                    return p != null && p.getStatus() == StudentProgressStatus.COMPLETED;
                })
                .filter(n -> (n.getTestKind() == null || n.getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.NONE)
                        && n.getLevel() != null && !n.getLevel().equals(level)
                        && n.getStageOrder() != null)
                .map(LearningNode::getStageOrder)
                .collect(Collectors.toSet());


        List<LearningNode> nodes = allNodes.stream()
                .filter(n -> {
                    StudentNodeProgress p = progressMap.get(n.getNodeId());
                    if (p != null && p.getStatus() == StudentProgressStatus.COMPLETED) {
                        return true;
                    }
                    if (n.getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.FREE_CHOICE) {
                        return true;
                    }
                    if (n.getLevel() == null) {
                        return true;
                    }
                    return n.getLevel().equals(level) && !stagesDoneAtOtherLevel.contains(n.getStageOrder());
                })
                .collect(Collectors.toList());
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


        Set<Long> countableNodeIds = nodes.stream()
                .filter(n -> {
                    StudentNodeProgress p = progressMap.get(n.getNodeId());
                    if (p != null && p.getStatus() == StudentProgressStatus.COMPLETED) {
                        return true;
                    }
                    return n.getLevel() == null || n.getLevel().equals(level);
                })
                .map(LearningNode::getNodeId)
                .collect(Collectors.toSet());

        int totalMaterials = 0;
        int completedMaterials = 0;
        if (!countableNodeIds.isEmpty()) {
            int totalMat = nodeMaterialRepository.countByLearningNodeNodeIdInAndIsDeletedFalse(countableNodeIds);
            int completedMat = studentMaterialProgressRepository.countCompletedMaterialsByStudentAndNodeIds(studentId, countableNodeIds);

            int totalExe = nodeExerciseRepository.countByLearningNodeNodeIdInAndIsDeletedFalse(countableNodeIds);
            int completedExe = submissionRepository.countCompletedExercisesByStudentAndNodeIds(studentId, countableNodeIds);

            int totalTst = testRepository.countByLearningNodeNodeIdInAndIsDeletedFalse(countableNodeIds);
            int completedTst = studentTestAttemptRepository.countCompletedTestsByStudentAndNodeIds(studentId, countableNodeIds);

            totalMaterials = totalMat + totalExe + totalTst;
            completedMaterials = completedMat + completedExe + completedTst;
        }

        return ClassroomGraphResponse.builder()
                .classroomSubjectId(classroomSubjectId)
                .state("PUBLISHED")
                .pathId(path.getPathId())
                .publishedAt(path.getPublishedAt())
                .nodes(nodeResponses)
                .edges(edgeResponses)
                .availableTemplates(null)
                .totalMaterials(totalMaterials)
                .completedMaterials(completedMaterials)
                .build();
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

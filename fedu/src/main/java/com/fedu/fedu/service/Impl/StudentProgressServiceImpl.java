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
        // Verify student is enrolled in the classroom-subject
        ClassroomSubjectStudent enrollment = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Học sinh không thuộc lớp-môn này"));

        // Path phải ĐÃ XUẤT BẢN thì học sinh mới thấy bất cứ thứ gì (kể cả bài phân loại).
        // Check này phải đứng TRƯỚC check currentLevel: path còn nháp (teacher vừa clone,
        // quizStart đã được gán lúc clone) mà trả NEED_PLACEMENT là học sinh thấy nút làm bài.
        LearningPath path = learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                .orElse(null);
        if (path == null || path.getPublishedAt() == null) {
            // No path published yet
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
            return ClassroomGraphResponse.builder()
                    .classroomSubjectId(classroomSubjectId)
                    .state("NEED_PLACEMENT")
                    .pathId(null)
                    .publishedAt(null)
                    .nodes(Collections.emptyList())
                    .edges(Collections.emptyList())
                    .availableTemplates(Collections.emptyList())
                    .build();
        }

        Integer level = enrollment.getCurrentLevel();
        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId())
                .stream()
                .filter(n -> n.getLevel() == null || n.getLevel().equals(level))
                .collect(Collectors.toList());
        Set<Long> visibleNodeIds = nodes.stream().map(LearningNode::getNodeId).collect(Collectors.toSet());
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId())
                .stream()
                .filter(e -> visibleNodeIds.contains(e.getFromNode().getNodeId())
                        && visibleNodeIds.contains(e.getToNode().getNodeId()))
                .collect(Collectors.toList());

        // Fetch student progress list
        List<StudentNodeProgress> progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
        // Auto-heal stuck PLACEMENT nodes
        boolean healed = false;
        List<StudentNodeProgress> incompletePlacements = progressList.stream()
                .filter(p -> p.getLearningNode().getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.PLACEMENT
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

            // Now unlock direct successors of PLACEMENT nodes
            List<NodeEdge> pathEdges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
            for (StudentNodeProgress p : progressList) {
                if (p.getStatus() == StudentProgressStatus.LOCKED) {
                    LearningNode node = p.getLearningNode();
                    boolean levelOk = node.getLevel() == null || node.getLevel().equals(level);

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

            // Refetch progress list if healed
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

        // 1. Materials
        int totalMat = nodeMaterialRepository.countTotalMaterialsByPathIdAndLevel(path.getPathId(), level);
        int completedMat = studentMaterialProgressRepository.countCompletedMaterialsByStudentAndPathAndLevel(studentId, path.getPathId(), level);

        // 2. Exercises
        int totalExe = nodeExerciseRepository.countTotalExercisesByPathIdAndLevel(path.getPathId(), level);
        int completedExe = submissionRepository.countCompletedExercisesByStudentAndPathAndLevel(studentId, path.getPathId(), level);

        // 3. Tests
        int totalTst = testRepository.countTotalTestsByPathIdAndLevel(path.getPathId(), level);
        int completedTst = studentTestAttemptRepository.countCompletedTestsByStudentAndPathAndLevel(studentId, path.getPathId(), level);

        int totalMaterials = totalMat + totalExe + totalTst;
        int completedMaterials = completedMat + completedExe + completedTst;

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

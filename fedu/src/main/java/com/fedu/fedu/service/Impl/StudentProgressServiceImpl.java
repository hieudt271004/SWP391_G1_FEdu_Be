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

    @Override
    @Transactional(readOnly = true)
    public ClassroomGraphResponse getStudentClassroomGraph(Long classroomSubjectId, Long studentId) {
        // Verify student is enrolled in the classroom-subject
        boolean isEnrolled = classroomSubjectStudentRepository
                .existsByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId);
        if (!isEnrolled) {
            throw new AccessDeniedException("Học sinh không thuộc lớp-môn này");
        }

        Optional<LearningPath> pathOpt = learningPathRepository.findByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);
        if (pathOpt.isEmpty() || pathOpt.get().getPublishedAt() == null) {
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

        LearningPath path = pathOpt.get();

        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());

        // Fetch student progress list
        List<StudentNodeProgress> progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
        Map<Long, String> progressMap = progressList.stream()
                .collect(Collectors.toMap(
                        p -> p.getLearningNode().getNodeId(),
                        p -> p.getStatus().name()
                ));

        List<LearningNodeResponse> nodeResponses = nodes.stream()
                .map(n -> {
                    String studentStatus = progressMap.getOrDefault(n.getNodeId(), "LOCKED");
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
                            .branchName(n.getBranchName())
                            .isDeleted(n.getIsDeleted())
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
                        .branchName(e.getBranchName())
                        .minScore(e.getMinScore())
                        .maxScore(e.getMaxScore())
                        .build())
                .collect(Collectors.toList());

        return ClassroomGraphResponse.builder()
                .classroomSubjectId(classroomSubjectId)
                .state("PUBLISHED")
                .pathId(path.getPathId())
                .publishedAt(path.getPublishedAt())
                .nodes(nodeResponses)
                .edges(edgeResponses)
                .availableTemplates(null)
                .build();
    }
}

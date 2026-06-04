package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateLearningNodeRequest;
import com.fedu.fedu.dto.req.CreateLearningPathRequest;
import com.fedu.fedu.dto.req.UpdateLearningNodeRequest;
import com.fedu.fedu.dto.req.UpdateLearningPathRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.utils.enums.NodeStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningPathServiceImpl implements LearningPathService {

    private final LearningPathRepository learningPathRepository;
    private final ClassroomLearningPathRepository classroomLearningPathRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final NodeEdgeRepository nodeEdgeRepository;
    private final SubjectRepository subjectRepository;
    private final ClassroomRepository classroomRepository;

    @Override
    @Transactional(readOnly = true)
    public List<LearningPathResponse> getLearningPathsBySubjectId(Long subjectId) {
        List<LearningPath> learningPaths = learningPathRepository.findBySubjectSubjectIdAndIsDeletedFalse(subjectId);
        return learningPaths.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LearningPathResponse createLearningPath(CreateLearningPathRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new RuntimeException("Subject not found"));

        LearningPath learningPath = LearningPath.builder()
                .subject(subject)
                .pathName(request.getPathName())
                .description(request.getDescription())
                .isDeleted(false)
                .build();

        learningPathRepository.save(learningPath);
        return mapToResponse(learningPath);
    }

    @Override
    @Transactional
    public LearningPathResponse updateLearningPath(Long pathId, UpdateLearningPathRequest request) {

        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new RuntimeException("Learning path not found"));

        learningPath.setPathName(request.getPathName());
        learningPath.setDescription(request.getDescription());
        learningPathRepository.save(learningPath);
        return mapToResponse(learningPath);
    }

    @Override
    @Transactional
    public void deleteLearningPath(Long pathId) {
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new RuntimeException("Learning path not found"));
        learningPath.setIsDeleted(true);
        learningPathRepository.save(learningPath);
    }

    @Override
    @Transactional(readOnly = true)
    public LearningPathResponse getLearningPathById(Long pathId) {

        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new RuntimeException("Learning path not found"));
        return mapToResponse(learningPath);
    }

    @Override
    @Transactional
    public ClassroomLearningPathResponse cloneLearningPath(Long classroomId, Long pathId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new RuntimeException("Learning path not found"));

        ClassroomLearningPath classroomPath = ClassroomLearningPath.builder()
                .classroom(classroom)
                .originalPath(learningPath)
                .pathName(learningPath.getPathName())
                .description(learningPath.getDescription())
                .isDeleted(false)
                .build();
        classroomLearningPathRepository.save(classroomPath);

        List<LearningNode> templateNodes = learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalseOrderByDisplayOrderAsc(pathId);

        Map<Long, LearningNode> nodeMapping = new HashMap<>();
        for (LearningNode templateNode : templateNodes) {

            LearningNode clonedNode = LearningNode.builder()
                    .classroomLearningPath(classroomPath)
                    .title(templateNode.getTitle())
                    .description(templateNode.getDescription())
                    .nodeType(templateNode.getNodeType())
                    .branchName(templateNode.getBranchName())
                    .displayOrder(templateNode.getDisplayOrder())
                    .status(NodeStatus.LOCKED)
                    .isRequired(templateNode.getIsRequired())
                    .isDeleted(false)
                    .build();
            learningNodeRepository.save(clonedNode);
            nodeMapping.put(templateNode.getNodeId(), clonedNode);
        }
        List<Long> templateNodeIds = templateNodes.stream()
                        .map(LearningNode::getNodeId)
                        .collect(Collectors.toList());

        List<NodeEdge> templateEdges = nodeEdgeRepository
                        .findByFromNodeNodeIdIn(templateNodeIds);

        List<NodeEdge> clonedEdges = new ArrayList<>();
        for (NodeEdge templateEdge : templateEdges) {
            LearningNode clonedFrom = nodeMapping.get(templateEdge.getFromNode().getNodeId());
            LearningNode clonedTo = nodeMapping.get(templateEdge.getToNode().getNodeId());

            NodeEdge clonedEdge = NodeEdge.builder()
                    .fromNode(clonedFrom)
                    .toNode(clonedTo)
                    .branchName(templateEdge.getBranchName())
                    .minScore(templateEdge.getMinScore())
                    .maxScore(templateEdge.getMaxScore())
                    .build();

            clonedEdges.add(clonedEdge);
        }
            nodeEdgeRepository.saveAll(clonedEdges);

            return mapToClassroomPathResponse(classroomPath);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ClassroomLearningPathResponse> getClassroomLearningPaths(Long classroomId) {
        return classroomLearningPathRepository
                .findByClassroomClassroomIdAndIsDeletedFalse(classroomId)
                .stream()
                .map(this::mapToClassroomPathResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LearningNodeResponse createLearningNode(CreateLearningNodeRequest request) {
        LearningNode.LearningNodeBuilder builder = LearningNode.builder()
                        .title(request.getTitle())
                        .description(request.getDescription())
                        .nodeType(request.getNodeType())
                        .branchName(request.getBranchName())
                        .displayOrder(request.getDisplayOrder())
                        .status(request.getStatus())
                        .isRequired(request.getIsRequired())
                        .isDeleted(false);

        if (request.getLearningPathId() != null) {

            LearningPath learningPath = learningPathRepository.findById(request.getLearningPathId())
                            .orElseThrow(() -> new RuntimeException("Path not found"));
            builder.learningPath(learningPath);
        }
        if (request.getClassroomPathId() != null) {
            ClassroomLearningPath classroomPath = classroomLearningPathRepository.findById(request.getClassroomPathId())
                            .orElseThrow(() -> new RuntimeException("Classroom path not found"));
            builder.classroomLearningPath(classroomPath);
        }
        LearningNode learningNode = builder.build();
        learningNodeRepository.save(learningNode);
        return mapToLearningNodeResponse(learningNode);
    }

    @Override
    @Transactional
    public LearningNodeResponse updateLearningNode(Long nodeId, UpdateLearningNodeRequest request) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));

        node.setTitle(request.getTitle());
        node.setDescription(request.getDescription());
        node.setNodeType(request.getNodeType());
        node.setBranchName(request.getBranchName());
        node.setDisplayOrder(request.getDisplayOrder());
        node.setStatus(request.getStatus());
        node.setIsRequired(request.getIsRequired());
        learningNodeRepository.save(node);
        return mapToLearningNodeResponse(node);
    }

    @Override
    @Transactional
    public void deleteLearningNode(Long nodeId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));
        node.setIsDeleted(true);
        learningNodeRepository.save(node);
    }

    @Override
    @Transactional(readOnly = true)
    public LearningNodeResponse getLearningNodeById(Long nodeId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new RuntimeException("Node not found"));
        return mapToLearningNodeResponse(node);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningNodeResponse> getTemplateNodesByPathId(Long pathId) {
        return learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalseOrderByDisplayOrderAsc(pathId)
                .stream()
                .map(this::mapToLearningNodeResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningNodeResponse> getTemplateNodesBySubjectId(Long subjectId) {
        return learningNodeRepository
                .findAllTemplateNodesBySubjectId(subjectId)
                .stream()
                .map(this::mapToLearningNodeResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningNodeResponse> getClassroomNodesByClassroomPathId(Long classroomPathId) {
        return learningNodeRepository
                .findByClassroomLearningPathClassroomPathIdAndIsDeletedFalseOrderByDisplayOrderAsc(classroomPathId)
                .stream()
                .map(this::mapToLearningNodeResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningNodeResponse> getClassroomNodesByClassroomId(Long classroomId) {
        return learningNodeRepository
                .findAllClassroomNodesByClassroomId(classroomId)
                .stream()
                .map(this::mapToLearningNodeResponse)
                .collect(Collectors.toList());
    }

    private LearningPathResponse mapToResponse(LearningPath learningPath) {
        return LearningPathResponse.builder()
                .pathId(learningPath.getPathId())
                .subjectId(learningPath.getSubject() != null ? learningPath.getSubject().getSubjectId() : null)
                .pathName(learningPath.getPathName())
                .description(learningPath.getDescription())
                .createdById(learningPath.getCreatedBy() != null ? learningPath.getCreatedBy().getUserId() : null)
                .createdAt(learningPath.getCreatedAt())
                .updatedAt(learningPath.getUpdatedAt())
                .build();
    }

    private LearningPathResponse mapToLearningPathResponse(LearningPath learningPath) {
        return LearningPathResponse.builder()
                .pathId(learningPath.getPathId())
                .subjectId(learningPath.getSubject() != null ? learningPath.getSubject().getSubjectId() : null)
                .pathName(learningPath.getPathName())
                .description(learningPath.getDescription())
                .createdById(learningPath.getCreatedBy() != null ? learningPath.getCreatedBy().getUserId() : null)
                //.isDeleted(learningPath.getIsDeleted())
                .createdAt(learningPath.getCreatedAt())
                .updatedAt(learningPath.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LearningPathGraphResponse getLearningPathGraph(Long pathId) {

        LearningPath learningPath = learningPathRepository
                .findById(pathId)
                .orElseThrow(() ->
                        new RuntimeException("Learning path not found"));

        List<LearningNodeResponse> nodes =
                learningNodeRepository
                        .findByLearningPathPathIdAndIsDeletedFalseOrderByDisplayOrderAsc(pathId)
                        .stream()
                        .map(this::mapToLearningNodeResponse)
                        .toList();

        List<NodeEdgeResponse> edges =
                nodeEdgeRepository
                        .findByFromNodeLearningPathPathId(pathId)
                        .stream()
                        .map(this::mapToEdgeResponse)
                        .toList();

        return LearningPathGraphResponse.builder()
                .pathId(learningPath.getPathId())
                .pathName(learningPath.getPathName())
                .description(learningPath.getDescription())
                .nodes(nodes)
                .edges(edges)
                .build();
    }

    private ClassroomLearningPathResponse mapToClassroomPathResponse(ClassroomLearningPath classroomPath) {

        return ClassroomLearningPathResponse.builder()
                .classroomPathId(classroomPath.getClassroomPathId())
                .classroomId(classroomPath.getClassroom().getClassroomId())
                .originalPathId(classroomPath.getOriginalPath() != null ? classroomPath.getOriginalPath().getPathId() : null)
                .pathName(classroomPath.getPathName())
                .description(classroomPath.getDescription())
                .isDeleted(classroomPath.getIsDeleted())
                .createdAt(classroomPath.getCreatedAt())
                .updatedAt(classroomPath.getUpdatedAt())
                .build();
    }

    private LearningNodeResponse mapToLearningNodeResponse(LearningNode node) {
        return LearningNodeResponse.builder()
                .nodeId(node.getNodeId())
                .learningPathId(node.getLearningPath() != null ? node.getLearningPath().getPathId() : null)
                .classroomPathId(node.getClassroomLearningPath() != null ? node.getClassroomLearningPath().getClassroomPathId() : null)
                .title(node.getTitle())
                .description(node.getDescription())
                .nodeType(node.getNodeType())
                .branchName(node.getBranchName())
                .displayOrder(node.getDisplayOrder())
                .status(node.getStatus())
                .isRequired(node.getIsRequired())
                .isDeleted(node.getIsDeleted())
                .createdAt(node.getCreatedAt())
                .updatedAt(node.getUpdatedAt())
                .build();
    }

    private NodeEdgeResponse mapToEdgeResponse(NodeEdge edge) {
        return NodeEdgeResponse.builder()
                .edgeId(edge.getEdgeId())
                .fromNodeId(edge.getFromNode().getNodeId())
                .toNodeId(edge.getToNode().getNodeId())
                .branchName(edge.getBranchName())
                .minScore(edge.getMinScore())
                .maxScore(edge.getMaxScore())
                .build();
    }

    @Override
    @Transactional
    public LearningPathGraphResponse getClassroomLearningPathGraph(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        List<ClassroomLearningPath> classroomPaths = classroomLearningPathRepository.findByClassroomClassroomIdAndIsDeletedFalse(classroomId);

        ClassroomLearningPath classroomPath;
        if (classroomPaths.isEmpty()) {
            List<LearningPath> subjectPaths = learningPathRepository
                    .findBySubjectSubjectIdAndIsDeletedFalse(classroom.getSubject().getSubjectId());

            LearningPath templatePath;
            if (subjectPaths.isEmpty()) {
                templatePath = LearningPath.builder()
                        .subject(classroom.getSubject())
                        .pathName("Default Roadmap - " + classroom.getSubject().getSubjectCode())
                        .description("Default roadmap template")
                        .isDeleted(false)
                        .build();
                learningPathRepository.save(templatePath);
            } else {
                templatePath = subjectPaths.get(0);
            }

            classroomPath = ClassroomLearningPath.builder()
                    .classroom(classroom)
                    .originalPath(templatePath)
                    .pathName(templatePath.getPathName())
                    .description(templatePath.getDescription())
                    .isDeleted(false)
                    .build();
            classroomLearningPathRepository.save(classroomPath);

            List<LearningNode> templateNodes = learningNodeRepository
                    .findByLearningPathPathIdAndIsDeletedFalseOrderByDisplayOrderAsc(templatePath.getPathId());

            Map<Long, LearningNode> nodeMapping = new HashMap<>();
            for (LearningNode templateNode : templateNodes) {
                LearningNode clonedNode = LearningNode.builder()
                        .classroomLearningPath(classroomPath)
                        .title(templateNode.getTitle())
                        .description(templateNode.getDescription())
                        .nodeType(templateNode.getNodeType())
                        .branchName(templateNode.getBranchName())
                        .displayOrder(templateNode.getDisplayOrder())
                        .status(NodeStatus.LOCKED)
                        .isRequired(templateNode.getIsRequired())
                        .isDeleted(false)
                        .build();
                learningNodeRepository.save(clonedNode);
                nodeMapping.put(templateNode.getNodeId(), clonedNode);
            }

            List<Long> templateNodeIds = templateNodes.stream()
                    .map(LearningNode::getNodeId)
                    .toList();
            if (!templateNodeIds.isEmpty()) {
                List<NodeEdge> templateEdges = nodeEdgeRepository.findByFromNodeNodeIdIn(templateNodeIds);
                List<NodeEdge> clonedEdges = new ArrayList<>();
                for (NodeEdge templateEdge : templateEdges) {
                    LearningNode clonedFrom = nodeMapping.get(templateEdge.getFromNode().getNodeId());
                    LearningNode clonedTo = nodeMapping.get(templateEdge.getToNode().getNodeId());
                    if (clonedFrom != null && clonedTo != null) {
                        NodeEdge clonedEdge = NodeEdge.builder()
                                .fromNode(clonedFrom)
                                .toNode(clonedTo)
                                .branchName(templateEdge.getBranchName())
                                .minScore(templateEdge.getMinScore())
                                .maxScore(templateEdge.getMaxScore())
                                .build();
                        clonedEdges.add(clonedEdge);
                    }
                }
                nodeEdgeRepository.saveAll(clonedEdges);
            }
        } else {
            classroomPath = classroomPaths.get(0);
        }

        List<LearningNodeResponse> nodes = learningNodeRepository
                .findByClassroomLearningPathClassroomPathIdAndIsDeletedFalseOrderByDisplayOrderAsc(classroomPath.getClassroomPathId())
                .stream()
                .map(this::mapToLearningNodeResponse)
                .toList();

        List<Long> nodeIds = nodes.stream().map(LearningNodeResponse::getNodeId).toList();
        List<NodeEdgeResponse> edges = new ArrayList<>();
        if (!nodeIds.isEmpty()) {
            edges = nodeEdgeRepository.findByFromNodeNodeIdIn(nodeIds)
                    .stream()
                    .map(this::mapToEdgeResponse)
                    .toList();
        }

        return LearningPathGraphResponse.builder()
                .pathId(classroomPath.getClassroomPathId())
                .pathName(classroomPath.getPathName())
                .description(classroomPath.getDescription())
                .nodes(nodes)
                .edges(edges)
                .build();
    }
}
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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningPathServiceImpl implements LearningPathService {

    private final LearningPathRepository learningPathRepository;
    private final LearningNodeRepository learningNodeRepository;
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

    /**
     * Clone lộ trình mẫu (template) thành một lộ trình riêng cho lớp học.
     * Bảng ClassroomLearningPath đã được gộp vào LearningPath với classroom_id và original_path_id.
     */
    @Override
    @Transactional
    public LearningPathResponse cloneLearningPath(Long classroomId, Long pathId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new RuntimeException("Classroom not found"));

        LearningPath templatePath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new RuntimeException("Learning path not found"));

        // Tạo bản clone LearningPath cho lớp học
        LearningPath classroomPath = LearningPath.builder()
                .subject(templatePath.getSubject())
                .pathName(templatePath.getPathName())
                .description(templatePath.getDescription())
                .classroom(classroom)
                .originalPath(templatePath)
                .isDeleted(false)
                .build();
        learningPathRepository.save(classroomPath);

        // Clone các node từ template sang path của lớp học
        List<LearningNode> templateNodes = learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalse(pathId);

        for (LearningNode templateNode : templateNodes) {
            LearningNode clonedNode = LearningNode.builder()
                    .learningPath(classroomPath)
                    .title(templateNode.getTitle())
                    .description(templateNode.getDescription())
                    .nodeType(templateNode.getNodeType())
                    .status(NodeStatus.LOCKED)
                    .isDeleted(false)
                    .build();
            learningNodeRepository.save(clonedNode);
        }

        return mapToResponse(classroomPath);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningPathResponse> getClassroomLearningPaths(Long classroomId) {
        return learningPathRepository
                .findByClassroomClassroomIdAndIsDeletedFalse(classroomId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LearningNodeResponse createLearningNode(CreateLearningNodeRequest request) {
        LearningPath learningPath = learningPathRepository.findById(request.getLearningPathId())
                .orElseThrow(() -> new RuntimeException("Learning path not found"));

        LearningNode learningNode = LearningNode.builder()
                .learningPath(learningPath)
                .title(request.getTitle())
                .description(request.getDescription())
                .nodeType(request.getNodeType())
                .status(request.getStatus())
                .isDeleted(false)
                .build();

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
        node.setStatus(request.getStatus());
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
                .findByLearningPathPathIdAndIsDeletedFalse(pathId)
                .stream()
                .map(this::mapToLearningNodeResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningNodeResponse> getClassroomNodesByClassroomId(Long classroomId) {
        return learningPathRepository
                .findByClassroomClassroomIdAndIsDeletedFalse(classroomId)
                .stream()
                .flatMap(path -> learningNodeRepository
                        .findByLearningPathPathIdAndIsDeletedFalse(path.getPathId())
                        .stream())
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
                .classroomId(learningPath.getClassroom() != null ? learningPath.getClassroom().getClassroomId() : null)
                .originalPathId(learningPath.getOriginalPath() != null ? learningPath.getOriginalPath().getPathId() : null)
                .createdAt(learningPath.getCreatedAt())
                .updatedAt(learningPath.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LearningPathGraphResponse getLearningPathGraph(Long pathId) {
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new RuntimeException("Learning path not found"));

        List<LearningNodeResponse> nodes = learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalse(pathId)
                .stream()
                .map(this::mapToLearningNodeResponse)
                .collect(Collectors.toList());

        return LearningPathGraphResponse.builder()
                .pathId(learningPath.getPathId())
                .pathName(learningPath.getPathName())
                .description(learningPath.getDescription())
                .nodes(nodes)
                .build();
    }

    //@Override
    @Transactional(readOnly = true)
    public List<LearningNodeResponse> getTemplateNodesBySubjectId(Long subjectId) {
        return learningNodeRepository
                .findAllTemplateNodesBySubjectId(subjectId)
                .stream()
                .map(this::mapToLearningNodeResponse)
                .collect(Collectors.toList());
    }

    private LearningNodeResponse mapToLearningNodeResponse(LearningNode node) {
        return LearningNodeResponse.builder()
                .nodeId(node.getNodeId())
                .learningPathId(node.getLearningPath() != null ? node.getLearningPath().getPathId() : null)
                .title(node.getTitle())
                .description(node.getDescription())
                .nodeType(node.getNodeType())
                .status(node.getStatus())
                .isDeleted(node.getIsDeleted())
                .createdAt(node.getCreatedAt())
                .updatedAt(node.getUpdatedAt())
                .build();
    }
}
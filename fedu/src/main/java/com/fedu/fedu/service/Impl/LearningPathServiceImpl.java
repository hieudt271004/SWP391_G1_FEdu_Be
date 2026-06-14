package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateLearningNodeRequest;
import com.fedu.fedu.dto.req.CreateLearningPathRequest;
import com.fedu.fedu.dto.req.UpdateLearningNodeRequest;
import com.fedu.fedu.dto.req.UpdateLearningPathRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeType;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class LearningPathServiceImpl implements LearningPathService {

    private final LearningPathRepository learningPathRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final SubjectRepository subjectRepository;
    private final ClassroomRepository classroomRepository;
    private final NodeEdgeRepository nodeEdgeRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public List<LearningPathResponse> getLearningPathsBySubjectId(Long subjectId) {
        List<LearningPath> learningPaths = learningPathRepository.findBySubjectSubjectIdAndClassroomIsNullAndIsDeletedFalse(subjectId);
        return learningPaths.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LearningPathResponse createLearningPath(CreateLearningPathRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        Classroom classroom = null;
        if (request.getClassroomId() != null) {
            classroom = classroomRepository.findById(request.getClassroomId())
                    .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        }

        LearningPath learningPath = LearningPath.builder()
                .subject(subject)
                .pathName(request.getPathName())
                .description(request.getDescription())
                .classroom(classroom)
                .isDeleted(false)
                .build();

        learningPathRepository.save(learningPath);
        return mapToResponse(learningPath);
    }

    @Override
    @Transactional
    public LearningPathResponse updateLearningPath(Long pathId, UpdateLearningPathRequest request) {
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        learningPath.setPathName(request.getPathName());
        learningPath.setDescription(request.getDescription());
        learningPathRepository.save(learningPath);
        return mapToResponse(learningPath);
    }

    @Override
    @Transactional
    public void deleteLearningPath(Long pathId) {
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));
        learningPath.setIsDeleted(true);
        learningPathRepository.save(learningPath);
    }

    @Override
    @Transactional(readOnly = true)
    public LearningPathResponse getLearningPathById(Long pathId) {
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));
        return mapToResponse(learningPath);
    }

    /**
     * Clone lộ trình mẫu (template) thành một lộ trình riêng cho lớp học.
     * Bảng ClassroomLearningPath đã được gộp vào LearningPath với classroom_id và original_path_id.
     */
    @Override
    @Transactional
    public LearningPathResponse cloneLearningPath(Long classroomId, Long pathId) {
        assertTeacherOwnsClassroom(classroomId);

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

        LearningPath templatePath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        List<LearningNode> templateNodes = learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalse(pathId);
        List<NodeEdge> templateEdges = nodeEdgeRepository
                .findByFromNodeLearningPathPathId(pathId);

        // 1. Detect cycle and get entry nodes (Kahn's algorithm)
        validateAndGetEntryNodes(templateNodes, templateEdges);

        // 2. Tạo bản clone LearningPath cho lớp học
        LearningPath classroomPath = LearningPath.builder()
                .subject(templatePath.getSubject())
                .pathName(templatePath.getPathName())
                .description(templatePath.getDescription())
                .classroom(classroom)
                .originalPath(templatePath)
                .isDeleted(false)
                .build();
        
        try {
            learningPathRepository.save(classroomPath);
            learningPathRepository.flush();
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new InvalidDataException("Classroom đã có lộ trình. Xóa draft hoặc unpublish trước.");
        }

        // 3. Clone các node từ template sang path của lớp học
        Map<Long, LearningNode> templateNodeIdToCloned = new HashMap<>();
        for (LearningNode templateNode : templateNodes) {
            LearningNode clonedNode = LearningNode.builder()
                    .learningPath(classroomPath)
                    .title(templateNode.getTitle())
                    .description(templateNode.getDescription())
                    .nodeType(templateNode.getNodeType())
                    .status(NodeStatus.LOCKED)
                    .displayOrder(templateNode.getDisplayOrder() != null ? templateNode.getDisplayOrder() : 0)
                    .isRequired(templateNode.getIsRequired() != null ? templateNode.getIsRequired() : true)
                    .branchName(templateNode.getBranchName())
                    .isDeleted(false)
                    .build();
            learningNodeRepository.save(clonedNode);
            templateNodeIdToCloned.put(templateNode.getNodeId(), clonedNode);
        }

        // 4. Clone các edge từ template sang path của lớp học
        for (NodeEdge templateEdge : templateEdges) {
            LearningNode fromCloned = templateNodeIdToCloned.get(templateEdge.getFromNode().getNodeId());
            LearningNode toCloned = templateNodeIdToCloned.get(templateEdge.getToNode().getNodeId());
            if (fromCloned != null && toCloned != null) {
                NodeEdge clonedEdge = NodeEdge.builder()
                        .fromNode(fromCloned)
                        .toNode(toCloned)
                        .branchName(templateEdge.getBranchName())
                        .minScore(templateEdge.getMinScore())
                        .maxScore(templateEdge.getMaxScore())
                        .build();
                nodeEdgeRepository.save(clonedEdge);
            }
        }

        return mapToResponse(classroomPath);
    }

    private List<LearningNode> validateAndGetEntryNodes(List<LearningNode> nodes, List<NodeEdge> edges) {
        if (nodes.isEmpty()) {
            return new ArrayList<>();
        }
        
        Map<Long, Integer> inDegree = new HashMap<>();
        Map<Long, List<Long>> adjacencyList = new HashMap<>();
        Map<Long, LearningNode> nodeMap = new HashMap<>();
        
        for (LearningNode node : nodes) {
            inDegree.put(node.getNodeId(), 0);
            adjacencyList.put(node.getNodeId(), new ArrayList<>());
            nodeMap.put(node.getNodeId(), node);
        }
        
        for (NodeEdge edge : edges) {
            Long fromId = edge.getFromNode().getNodeId();
            Long toId = edge.getToNode().getNodeId();
            
            if (inDegree.containsKey(fromId) && inDegree.containsKey(toId)) {
                adjacencyList.get(fromId).add(toId);
                inDegree.put(toId, inDegree.get(toId) + 1);
            }
        }
        
        Queue<Long> queue = new LinkedList<>();
        List<LearningNode> entryNodes = new ArrayList<>();
        
        for (Map.Entry<Long, Integer> entry : inDegree.entrySet()) {
            if (entry.getValue() == 0) {
                queue.add(entry.getKey());
                entryNodes.add(nodeMap.get(entry.getKey()));
            }
        }
        
        int processedCount = 0;
        while (!queue.isEmpty()) {
            Long currentId = queue.poll();
            processedCount++;
            
            for (Long neighborId : adjacencyList.get(currentId)) {
                int newDegree = inDegree.get(neighborId) - 1;
                inDegree.put(neighborId, newDegree);
                if (newDegree == 0) {
                    queue.add(neighborId);
                }
            }
        }
        
        if (processedCount != nodes.size()) {
            throw new IllegalArgumentException("Template chứa cycle");
        }
        
        return entryNodes;
    }

    @Override
    @Transactional(readOnly = true)
    public List<LearningPathResponse> getClassroomLearningPaths(Long classroomId) {
        assertTeacherOwnsClassroom(classroomId);
        return learningPathRepository
                .findByClassroomClassroomIdAndIsDeletedFalse(classroomId)
                .map(this::mapToResponse)
                .map(List::of)
                .orElse(List.of());
    }

    @Override
    @Transactional
    public LearningNodeResponse createLearningNode(CreateLearningNodeRequest request) {
        Long pathId = request.getLearningPathId() != null ? request.getLearningPathId() : request.getClassroomPathId();
        if (pathId == null) {
            throw new InvalidDataException("Path ID must not be null");
        }
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        LearningNode learningNode = LearningNode.builder()
                .learningPath(learningPath)
                .title(request.getTitle())
                .description(request.getDescription())
                .nodeType(request.getNodeType())
                .status(request.getStatus() != null ? request.getStatus() : NodeStatus.LOCKED)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isRequired(request.getIsRequired() != null ? request.getIsRequired() : true)
                .branchName(request.getBranchName())
                .isDeleted(false)
                .build();

        learningNodeRepository.save(learningNode);
        return mapToLearningNodeResponse(learningNode);
    }

    @Override
    @Transactional
    public LearningNodeResponse updateLearningNode(Long nodeId, UpdateLearningNodeRequest request) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found"));

        node.setTitle(request.getTitle());
        node.setDescription(request.getDescription());
        node.setNodeType(request.getNodeType());
        node.setStatus(request.getStatus());
        node.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : node.getDisplayOrder());
        node.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : node.getIsRequired());
        node.setBranchName(request.getBranchName());

        learningNodeRepository.save(node);
        return mapToLearningNodeResponse(node);
    }

    @Override
    @Transactional
    public void deleteLearningNode(Long nodeId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found"));
        node.setIsDeleted(true);
        learningNodeRepository.save(node);
    }

    @Override
    @Transactional(readOnly = true)
    public LearningNodeResponse getLearningNodeById(Long nodeId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found"));
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
        assertTeacherOwnsClassroom(classroomId);
        return learningPathRepository
                .findByClassroomClassroomIdAndIsDeletedFalse(classroomId)
                .map(path -> learningNodeRepository
                        .findByLearningPathPathIdAndIsDeletedFalse(path.getPathId())
                        .stream()
                        .map(this::mapToLearningNodeResponse)
                        .collect(Collectors.toList()))
                .orElse(List.of());
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
                .publishedAt(learningPath.getPublishedAt())
                .publishedById(learningPath.getPublishedBy() != null ? learningPath.getPublishedBy().getUserId() : null)
                .createdAt(learningPath.getCreatedAt())
                .updatedAt(learningPath.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public LearningPathGraphResponse getLearningPathGraph(Long pathId) {
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        List<LearningNodeResponse> nodes = learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalse(pathId)
                .stream()
                .map(this::mapToLearningNodeResponse)
                .collect(Collectors.toList());

        List<NodeEdgeResponse> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(pathId)
                .stream()
                .map(e -> NodeEdgeResponse.builder()
                        .edgeId(e.getEdgeId())
                        .fromNodeId(e.getFromNode().getNodeId())
                        .toNodeId(e.getToNode().getNodeId())
                        .branchName(e.getBranchName())
                        .minScore(e.getMinScore())
                        .maxScore(e.getMaxScore())
                        .build())
                .collect(Collectors.toList());

        return LearningPathGraphResponse.builder()
                .pathId(learningPath.getPathId())
                .pathName(learningPath.getPathName())
                .description(learningPath.getDescription())
                .nodes(nodes)
                .edges(edges)
                .build();
    }

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
                .displayOrder(node.getDisplayOrder())
                .isRequired(node.getIsRequired())
                .branchName(node.getBranchName())
                .isDeleted(node.getIsDeleted())
                .createdAt(node.getCreatedAt())
                .updatedAt(node.getUpdatedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomGraphResponse getClassroomGraph(Long classroomId) {
        assertTeacherOwnsClassroom(classroomId);
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));

        Optional<LearningPath> pathOpt = learningPathRepository.findByClassroomClassroomIdAndIsDeletedFalse(classroomId);

        if (pathOpt.isEmpty()) {
            List<LearningPath> templates = learningPathRepository.findBySubjectSubjectIdAndClassroomIsNullAndIsDeletedFalse(
                    classroom.getSubject().getSubjectId());
            
            List<AvailableTemplateResponse> availableTemplates = templates.stream()
                    .map(t -> {
                        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(t.getPathId());
                        return AvailableTemplateResponse.builder()
                                .pathId(t.getPathId())
                                .pathName(t.getPathName())
                                .description(t.getDescription())
                                .nodeCount(nodes.size())
                                .lastUpdatedAt(t.getUpdatedAt())
                                .build();
                    })
                    .collect(Collectors.toList());

            return ClassroomGraphResponse.builder()
                    .classroomId(classroomId)
                    .state("NO_PATH")
                    .pathId(null)
                    .publishedAt(null)
                    .nodes(Collections.emptyList())
                    .edges(Collections.emptyList())
                    .availableTemplates(availableTemplates)
                    .build();
        }

        LearningPath path = pathOpt.get();
        String state = path.getPublishedAt() == null ? "DRAFT" : "PUBLISHED";

        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());

        List<LearningNodeResponse> nodeResponses = nodes.stream()
                .map(this::mapToLearningNodeResponse)
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
                .classroomId(classroomId)
                .state(state)
                .pathId(path.getPathId())
                .publishedAt(path.getPublishedAt())
                .nodes(nodeResponses)
                .edges(edgeResponses)
                .availableTemplates(null)
                .build();
    }

    @Override
    @Transactional
    public PublishResultResponse publishClassroomPath(Long classroomId, Long pathId) {
        assertTeacherOwnsClassroom(classroomId);
        LearningPath path = learningPathRepository.findByPathIdForUpdate(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        if (path.getClassroom() == null || !path.getClassroom().getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("Lộ trình không thuộc lớp học này.");
        }

        if (path.getPublishedAt() != null) {
            throw new InvalidDataException("Lộ trình đã được publish trước đó.");
        }

        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(pathId);
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(pathId);

        List<LearningNode> entryNodes = validateAndGetEntryNodes(nodes, edges);

        List<UserAccount> students = classroomSubjectStudentRepository.findDistinctStudentsByClassroomId(classroomId);

        List<StudentNodeProgress> progressList = new ArrayList<>();
        for (UserAccount student : students) {
            for (LearningNode node : nodes) {
                boolean isEntry = entryNodes.contains(node);
                StudentNodeProgress snp = StudentNodeProgress.builder()
                        .student(student)
                        .learningNode(node)
                        .learningPath(path)
                        .orderIndex(node.getDisplayOrder() != null ? node.getDisplayOrder() : 0)
                        .status(isEntry ? StudentProgressStatus.OPEN : StudentProgressStatus.LOCKED)
                        .unlockedAt(isEntry ? java.time.LocalDateTime.now() : null)
                        .build();
                progressList.add(snp);
            }
        }

        if (!progressList.isEmpty()) {
            studentNodeProgressRepository.saveAll(progressList);
        }

        path.setPublishedAt(java.time.LocalDateTime.now());
        
        try {
            String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            UserAccount currentUser = userAccountRepository.findByEmail(email).orElse(null);
            path.setPublishedBy(currentUser);
        } catch (Exception e) {
            // Context might not be set in test/seed scenarios
        }

        learningPathRepository.save(path);

        return PublishResultResponse.builder()
                .seededStudents(students.size())
                .build();
    }

    @Override
    @Transactional
    public void unpublishClassroomPath(Long classroomId, Long pathId) {
        assertTeacherOwnsClassroom(classroomId);
        LearningPath path = learningPathRepository.findByPathIdForUpdate(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        if (path.getClassroom() == null || !path.getClassroom().getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("Lộ trình không thuộc lớp học này.");
        }

        if (path.getPublishedAt() == null) {
            throw new InvalidDataException("Lộ trình chưa được publish.");
        }

        boolean hasCompleted = studentNodeProgressRepository.existsByLearningPathPathIdAndStatus(pathId, StudentProgressStatus.COMPLETED);
        if (hasCompleted) {
            throw new InvalidDataException("Đã có học sinh hoàn thành node, không thể unpublish.");
        }

        studentNodeProgressRepository.deleteAllByLearningPathPathId(pathId);

        path.setPublishedAt(null);
        path.setPublishedBy(null);
        learningPathRepository.save(path);
    }

    @Override
    @Transactional
    public void deleteDraftPath(Long classroomId, Long pathId) {
        assertTeacherOwnsClassroom(classroomId);
        LearningPath path = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        if (path.getClassroom() == null || !path.getClassroom().getClassroomId().equals(classroomId)) {
            throw new IllegalArgumentException("Lộ trình không thuộc lớp học này.");
        }

        if (path.getPublishedAt() != null) {
            throw new InvalidDataException("Không thể xóa lộ trình đã publish. Unpublish trước.");
        }

        path.setIsDeleted(true);
        learningPathRepository.save(path);

        // Soft delete all nodes in this path
        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(pathId);
        for (LearningNode node : nodes) {
            node.setIsDeleted(true);
            learningNodeRepository.save(node);
        }
    }

    @Override
    @Transactional
    public void backfillProgressForStudent(Long classroomId, Long studentId) {
        Optional<LearningPath> pathOpt = learningPathRepository.findByClassroomClassroomIdAndIsDeletedFalse(classroomId);
        if (pathOpt.isEmpty()) {
            return;
        }

        LearningPath path = pathOpt.get();
        if (path.getPublishedAt() == null) {
            return;
        }

        UserAccount student = userAccountRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        // Idempotency check
        List<StudentNodeProgress> existing = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
        if (!existing.isEmpty()) {
            return;
        }

        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
        List<LearningNode> entryNodes = validateAndGetEntryNodes(nodes, edges);

        List<StudentNodeProgress> progressList = new ArrayList<>();
        for (LearningNode node : nodes) {
            boolean isEntry = entryNodes.contains(node);
            StudentNodeProgress snp = StudentNodeProgress.builder()
                    .student(student)
                    .learningNode(node)
                    .learningPath(path)
                    .orderIndex(node.getDisplayOrder() != null ? node.getDisplayOrder() : 0)
                    .status(isEntry ? StudentProgressStatus.OPEN : StudentProgressStatus.LOCKED)
                    .unlockedAt(isEntry ? java.time.LocalDateTime.now() : null)
                    .build();
            progressList.add(snp);
        }

        studentNodeProgressRepository.saveAll(progressList);
    }

    private void assertTeacherOwnsClassroom(Long classroomId) {
        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom not found"));
        
        try {
            org.springframework.security.core.Authentication authentication = 
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null) {
                boolean isAdmin = authentication.getAuthorities().stream()
                        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
                if (!isAdmin) {
                    String email = authentication.getName();
                    if (classroom.getLecturer() == null || !classroom.getLecturer().getEmail().equals(email)) {
                        throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền truy cập");
                    }
                }
            }
        } catch (org.springframework.security.access.AccessDeniedException e) {
            throw e;
        } catch (Exception e) {
            // Context not set, e.g. in some testing scenarios, allow
        }
    }
}
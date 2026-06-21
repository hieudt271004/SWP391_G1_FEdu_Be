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
    private final NodeEdgeRepository nodeEdgeRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final UserAccountRepository userAccountRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    // content repos (clone copy toàn bộ giáo trình)
    private final NodeMaterialRepository nodeMaterialRepository;
    private final VideoRepository videoRepository;
    private final FileEntityRepository fileEntityRepository;
    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerRepository testAnswerRepository;

    // ── Learning Path (Template) ──────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<LearningPathResponse> getLearningPathsBySubjectId(Long subjectId) {
        return learningPathRepository
                .findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(subjectId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public LearningPathResponse createLearningPath(CreateLearningPathRequest request) {
        Subject subject = subjectRepository.findById(request.getSubjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Subject not found"));

        // Lộ trình gốc chỉ có 2 loại (cơ bản/nâng cao) và mỗi loại duy nhất 1 cái cho mỗi môn.
        // Thay đổi riêng cho từng lớp do giáo viên xử lý ở bản clone.
        boolean levelExists = learningPathRepository
                .findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(request.getSubjectId())
                .stream()
                .anyMatch(p -> java.util.Objects.equals(p.getLevel(), request.getLevel()));
        if (levelExists) {
            throw new InvalidDataException(
                    "Môn học đã có lộ trình mức này rồi. Mỗi môn chỉ có 1 lộ trình cho mỗi mức (1=yếu, 2=tb, 3=khá).");
        }

        LearningPath learningPath = LearningPath.builder()
                .subject(subject)
                .pathName(request.getPathName())
                .description(request.getDescription())
                .level(request.getLevel())
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
     * Clone lộ trình mẫu (template) thành lộ trình riêng cho một lớp-môn (classroom_subject),
     * copy TOÀN BỘ node + edge + nội dung (material/video/file, test/question/answer).
     */
    @Override
    @Transactional
    public LearningPathResponse cloneLearningPath(Long classroomSubjectId, Long templatePathId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);

        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom-subject not found"));
        LearningPath template = learningPathRepository.findById(templatePathId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));

        if (template.getClassroomSubject() != null
                || !template.getSubject().getSubjectId().equals(cs.getSubject().getSubjectId())) {
            throw new InvalidDataException("Template không hợp lệ cho môn của lớp này");
        }
        // Chỉ cho clone khi MÔN đã được xuất bản
        if (!"published".equalsIgnoreCase(cs.getSubject().getStatus())) {
            throw new InvalidDataException("Môn học chưa được xuất bản — không thể clone lộ trình cho lớp.");
        }
        learningPathRepository.findByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId)
                .ifPresent(p -> { throw new InvalidDataException("Lớp-môn đã có lộ trình. Xóa draft/unpublish trước."); });

        List<LearningNode> templateNodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(templatePathId);
        List<NodeEdge> templateEdges = nodeEdgeRepository.findByFromNodeLearningPathPathId(templatePathId);
        validateAndGetEntryNodes(templateNodes, templateEdges);

        LearningPath clonedPath = LearningPath.builder()
                .subject(template.getSubject())
                .classroomSubject(cs)
                .originalPath(template)
                .level(template.getLevel())
                .pathName(template.getPathName())
                .description(template.getDescription())
                .isDeleted(false)
                .build();
        try {
            learningPathRepository.save(clonedPath);
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            throw new InvalidDataException("Lớp-môn đã có lộ trình. Xóa draft/unpublish trước.");
        }

        Map<Long, LearningNode> nodeMap = new HashMap<>();
        for (LearningNode tn : templateNodes) {
            LearningNode cn = LearningNode.builder()
                    .learningPath(clonedPath)
                    .title(tn.getTitle())
                    .description(tn.getDescription())
                    .nodeType(tn.getNodeType())
                    .status(NodeStatus.LOCKED)
                    .displayOrder(tn.getDisplayOrder() != null ? tn.getDisplayOrder() : 0)
                    .isRequired(tn.getIsRequired() != null ? tn.getIsRequired() : true)
                    .branchName(tn.getBranchName())
                    .stageOrder(tn.getStageOrder())
                    .level(tn.getLevel())
                    .isDeleted(false)
                    .build();
            learningNodeRepository.save(cn);
            nodeMap.put(tn.getNodeId(), cn);
            copyNodeContent(tn, cn);
        }
        for (NodeEdge te : templateEdges) {
            LearningNode f = nodeMap.get(te.getFromNode().getNodeId());
            LearningNode t = nodeMap.get(te.getToNode().getNodeId());
            if (f != null && t != null) {
                nodeEdgeRepository.save(NodeEdge.builder()
                        .fromNode(f).toNode(t).branchName(te.getBranchName())
                        .minScore(te.getMinScore()).maxScore(te.getMaxScore()).build());
            }
        }
        return mapToResponse(clonedPath);
    }

    /** Copy material(+video,+file) và test(+question,+answer) từ node template sang node clone. */
    private void copyNodeContent(LearningNode src, LearningNode dst) {
        for (NodeMaterial m : nodeMaterialRepository.findByLearningNodeNodeIdAndIsDeletedFalse(src.getNodeId())) {
            NodeMaterial nm = NodeMaterial.builder()
                    .learningNode(dst)
                    .title(m.getTitle())
                    .required(m.getRequired() != null ? m.getRequired() : true)
                    .orderIndex(m.getOrderIndex())
                    .isDeleted(false)
                    .build();
            nodeMaterialRepository.save(nm);

            for (Video v : videoRepository.findByNodeMaterialMaterialIdAndIsDeletedFalse(m.getMaterialId())) {
                videoRepository.save(Video.builder()
                        .nodeMaterial(nm)
                        .videoUrl(v.getVideoUrl()).title(v.getTitle())
                        .durationSeconds(v.getDurationSeconds()).description(v.getDescription())
                        .isDeleted(false)
                        .build());
            }
            for (FileEntity f : fileEntityRepository.findByNodeMaterialMaterialIdAndIsDeletedFalse(m.getMaterialId())) {
                fileEntityRepository.save(FileEntity.builder()
                        .nodeMaterial(nm)
                        .fileUrl(f.getFileUrl()).fileName(f.getFileName())
                        .fileType(f.getFileType()).description(f.getDescription())
                        .isDeleted(false)
                        .build());
            }
        }

        for (Test t : testRepository.findByLearningNodeNodeIdAndIsDeletedFalse(src.getNodeId())) {
            Test nt = Test.builder()
                    .learningNode(dst)
                    .title(t.getTitle()).description(t.getDescription())
                    .durationMinutes(t.getDurationMinutes())
                    .passingPercentage(t.getPassingPercentage())
                    .orderIndex(t.getOrderIndex())
                    .isDeleted(false)
                    .build();
            testRepository.save(nt);

            for (TestQuestion q : testQuestionRepository.findByTestTestId(t.getTestId())) {
                TestQuestion nq = TestQuestion.builder()
                        .test(nt)
                        .questionContent(q.getQuestionContent())
                        .questionType(q.getQuestionType())
                        .score(q.getScore())
                        .build();
                testQuestionRepository.save(nq);

                for (TestAnswer a : testAnswerRepository.findByQuestionQuestionId(q.getQuestionId())) {
                    testAnswerRepository.save(TestAnswer.builder()
                            .question(nq)
                            .answerContent(a.getAnswerContent())
                            .isCorrect(a.getIsCorrect())
                            .build());
                }
            }
        }
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
    public List<LearningPathResponse> getClassroomLearningPaths(Long classroomSubjectId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        return learningPathRepository
                .findByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId)
                .map(this::mapToResponse)
                .map(List::of)
                .orElse(List.of());
    }

    // ── Learning Node ─────────────────────────────────────────────────────────

    @Override
    @Transactional
    public LearningNodeResponse createLearningNode(CreateLearningNodeRequest request) {
        Long pathId = request.getLearningPathId() != null ? request.getLearningPathId() : request.getClassroomPathId();
        if (pathId == null) {
            throw new InvalidDataException("Path ID must not be null");
        }
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        // Chỉ ADMIN (lộ trình gốc, classroomSubject == null) được tạo node loại "Trên lớp".
        if (request.getNodeType() == NodeType.ON_CLASS && learningPath.getClassroomSubject() != null) {
            throw new InvalidDataException("Chỉ admin được tạo node loại 'Trên lớp' (chỉ trên lộ trình gốc)");
        }

        // Validate stageOrder trong [1, subject.learningpathLength] và level node hợp lệ (null hoặc 1..3).
        if (request.getStageOrder() != null) {
            Integer length = learningPath.getSubject() != null
                    ? learningPath.getSubject().getLearningpathLength() : null;
            if (length != null && request.getStageOrder() > length) {
                throw new InvalidDataException(
                        "stageOrder phải trong [1, " + length + "] (số chặng của môn)");
            }
        }
        if (request.getLevel() != null && !com.fedu.fedu.utils.LearningLevels.isValid(request.getLevel())) {
            throw new InvalidDataException("level của node phải null (node chung) hoặc 1=yếu, 2=tb, 3=khá");
        }

        LearningNode learningNode = LearningNode.builder()
                .learningPath(learningPath)
                .title(request.getTitle())
                .description(request.getDescription())
                .nodeType(request.getNodeType())
                .status(request.getStatus() != null ? request.getStatus() : NodeStatus.LOCKED)
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .isRequired(request.getIsRequired() != null ? request.getIsRequired() : true)
                .branchName(request.getBranchName())
                .stageOrder(request.getStageOrder())
                .level(request.getLevel())
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

        // Không cho đổi node thành loại "Trên lớp" trên lộ trình của lớp-môn (chỉ admin/lộ trình gốc).
        if (request.getNodeType() == NodeType.ON_CLASS && node.getLearningPath().getClassroomSubject() != null) {
            throw new InvalidDataException("Chỉ admin được tạo node loại 'Trên lớp' (chỉ trên lộ trình gốc)");
        }

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
    public List<LearningNodeResponse> getClassroomNodesByClassroomId(Long classroomSubjectId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        return learningPathRepository
                .findByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId)
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
                .classroomSubjectId(learningPath.getClassroomSubject() != null ? learningPath.getClassroomSubject().getId() : null)
                .level(learningPath.getLevel())
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
                .map(this::mapToEdgeResponse)
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
                .stageOrder(node.getStageOrder())
                .level(node.getLevel())
                .createdAt(node.getCreatedAt())
                .updatedAt(node.getUpdatedAt())
                .build();
    }

    private NodeEdgeResponse mapToEdgeResponse(NodeEdge e) {
        return NodeEdgeResponse.builder()
                .edgeId(e.getEdgeId())
                .fromNodeId(e.getFromNode().getNodeId())
                .toNodeId(e.getToNode().getNodeId())
                .branchName(e.getBranchName())
                .minScore(e.getMinScore())
                .maxScore(e.getMaxScore())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomGraphResponse getClassroomGraph(Long classroomSubjectId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom-subject not found"));

        Optional<LearningPath> pathOpt = learningPathRepository.findByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);

        if (pathOpt.isEmpty()) {
            List<AvailableTemplateResponse> availableTemplates = learningPathRepository
                    .findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(cs.getSubject().getSubjectId())
                    .stream()
                    .map(t -> AvailableTemplateResponse.builder()
                            .pathId(t.getPathId())
                            .pathName(t.getPathName())
                            .description(t.getDescription())
                            .nodeCount(learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(t.getPathId()).size())
                            .lastUpdatedAt(t.getUpdatedAt())
                            .build())
                    .collect(Collectors.toList());

            return ClassroomGraphResponse.builder()
                    .classroomSubjectId(classroomSubjectId)
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

        List<LearningNodeResponse> nodeResponses = learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalse(path.getPathId())
                .stream().map(this::mapToLearningNodeResponse).collect(Collectors.toList());
        List<NodeEdgeResponse> edgeResponses = nodeEdgeRepository
                .findByFromNodeLearningPathPathId(path.getPathId())
                .stream().map(this::mapToEdgeResponse).collect(Collectors.toList());

        return ClassroomGraphResponse.builder()
                .classroomSubjectId(classroomSubjectId)
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
    public PublishResultResponse publishClassroomPath(Long classroomSubjectId, Long pathId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        LearningPath path = learningPathRepository.findByPathIdForUpdate(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        if (path.getClassroomSubject() == null || !path.getClassroomSubject().getId().equals(classroomSubjectId)) {
            throw new IllegalArgumentException("Lộ trình không thuộc lớp-môn này.");
        }
        if (path.getPublishedAt() != null) {
            throw new InvalidDataException("Lộ trình đã được publish trước đó.");
        }

        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(pathId);
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(pathId);
        List<LearningNode> entryNodes = validateAndGetEntryNodes(nodes, edges);

        List<UserAccount> students = classroomSubjectStudentRepository.findDistinctStudentsByClassroomSubjectId(classroomSubjectId);

        List<StudentNodeProgress> progressList = new ArrayList<>();
        for (UserAccount student : students) {
            for (LearningNode node : nodes) {
                // Node ON_CLASS luôn khóa (chỉ giáo viên mở), kể cả khi là node vào.
                boolean openIt = entryNodes.contains(node) && node.getNodeType() != NodeType.ON_CLASS;
                progressList.add(StudentNodeProgress.builder()
                        .student(student)
                        .learningNode(node)
                        .learningPath(path)
                        .orderIndex(node.getDisplayOrder() != null ? node.getDisplayOrder() : 0)
                        .status(openIt ? StudentProgressStatus.OPEN : StudentProgressStatus.LOCKED)
                        .unlockedAt(openIt ? java.time.LocalDateTime.now() : null)
                        .build());
            }
        }
        if (!progressList.isEmpty()) {
            studentNodeProgressRepository.saveAll(progressList);
        }

        path.setPublishedAt(java.time.LocalDateTime.now());
        try {
            String email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
            path.setPublishedBy(userAccountRepository.findByEmail(email).orElse(null));
        } catch (Exception e) {
            // Context might not be set in test/seed scenarios
        }
        learningPathRepository.save(path);

        return PublishResultResponse.builder().seededStudents(students.size()).build();
    }

    @Override
    @Transactional
    public void unpublishClassroomPath(Long classroomSubjectId, Long pathId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        LearningPath path = learningPathRepository.findByPathIdForUpdate(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        if (path.getClassroomSubject() == null || !path.getClassroomSubject().getId().equals(classroomSubjectId)) {
            throw new IllegalArgumentException("Lộ trình không thuộc lớp-môn này.");
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
    public void deleteDraftPath(Long classroomSubjectId, Long pathId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        LearningPath path = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        if (path.getClassroomSubject() == null || !path.getClassroomSubject().getId().equals(classroomSubjectId)) {
            throw new IllegalArgumentException("Lộ trình không thuộc lớp-môn này.");
        }
        if (path.getPublishedAt() != null) {
            throw new InvalidDataException("Không thể xóa lộ trình đã publish. Unpublish trước.");
        }

        path.setIsDeleted(true);
        learningPathRepository.save(path);

        for (LearningNode node : learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(pathId)) {
            node.setIsDeleted(true);
            learningNodeRepository.save(node);
        }
    }

    @Override
    @Transactional
    public void backfillProgressForStudent(Long classroomSubjectId, Long studentId) {
        Optional<LearningPath> pathOpt = learningPathRepository.findByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);
        if (pathOpt.isEmpty()) {
            return;
        }
        LearningPath path = pathOpt.get();
        if (path.getPublishedAt() == null) {
            return;
        }

        UserAccount student = userAccountRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        // Chưa làm bài test phân loại (currentLevel == null) → chưa khởi tạo tiến trình.
        // Backfill được gọi lại sau khi học sinh nộp placement quiz và được gán mức.
        Integer currentLevel = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .map(ClassroomSubjectStudent::getCurrentLevel)
                .orElse(null);
        if (currentLevel == null) {
            return;
        }

        // Idempotency
        if (!studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId()).isEmpty()) {
            return;
        }

        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
        List<LearningNode> entryNodes = validateAndGetEntryNodes(nodes, edges);

        List<StudentNodeProgress> progressList = new ArrayList<>();
        for (LearningNode node : nodes) {
            // Node nhánh (level != null) chỉ mở nếu khớp mức hiện tại; node chung (level == null) theo logic edge.
            boolean levelOk = node.getLevel() == null || node.getLevel().equals(currentLevel);
            // Node ON_CLASS luôn khóa (chỉ giáo viên mở), kể cả khi là node vào.
            boolean openIt = entryNodes.contains(node) && node.getNodeType() != NodeType.ON_CLASS && levelOk;
            progressList.add(StudentNodeProgress.builder()
                    .student(student)
                    .learningNode(node)
                    .learningPath(path)
                    .orderIndex(node.getDisplayOrder() != null ? node.getDisplayOrder() : 0)
                    .status(openIt ? StudentProgressStatus.OPEN : StudentProgressStatus.LOCKED)
                    .unlockedAt(openIt ? java.time.LocalDateTime.now() : null)
                    .build());
        }
        studentNodeProgressRepository.saveAll(progressList);
    }

    @Override
    @Transactional
    public int unlockOnClassNode(Long classroomSubjectId, Long nodeId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);

        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found"));
        if (node.getNodeType() != NodeType.ON_CLASS) {
            throw new InvalidDataException("Chỉ mở khóa được node loại 'Trên lớp'");
        }
        LearningPath path = node.getLearningPath();
        if (path.getClassroomSubject() == null
                || !path.getClassroomSubject().getId().equals(classroomSubjectId)) {
            throw new InvalidDataException("Node không thuộc lộ trình của lớp-môn này");
        }

        // TODO: sau này tự mở theo thời gian buổi học (chưa có thuộc tính thời gian) — hiện giáo viên mở thủ công.
        List<NodeEdge> incoming = nodeEdgeRepository.findByToNodeNodeId(nodeId);
        List<UserAccount> students =
                classroomSubjectStudentRepository.findDistinctStudentsByClassroomSubjectId(classroomSubjectId);

        int opened = 0;
        for (UserAccount student : students) {
            List<StudentNodeProgress> list = studentNodeProgressRepository
                    .findByStudentUserIdAndLearningPathPathId(student.getUserId(), path.getPathId());
            Map<Long, StudentProgressStatus> statusMap = list.stream()
                    .collect(Collectors.toMap(p -> p.getLearningNode().getNodeId(),
                            StudentNodeProgress::getStatus, (a, b) -> a));

            StudentNodeProgress target = list.stream()
                    .filter(p -> p.getLearningNode().getNodeId().equals(nodeId))
                    .findFirst().orElse(null);
            if (target == null || target.getStatus() != StudentProgressStatus.LOCKED) continue;

            // Tôn trọng điều kiện tiên quyết: chỉ mở cho học sinh đã hoàn thành các node trước.
            boolean prereqMet = incoming.stream().allMatch(
                    e -> statusMap.get(e.getFromNode().getNodeId()) == StudentProgressStatus.COMPLETED);
            if (!prereqMet) continue;

            target.setStatus(StudentProgressStatus.OPEN);
            target.setUnlockedAt(java.time.LocalDateTime.now());
            studentNodeProgressRepository.save(target);
            opened++;
        }
        return opened;
    }

    private void assertTeacherOwnsClassroomSubject(Long csId) {
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null) return; // test/seed
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;
        UserAccount actor = userAccountRepository.findByEmail(auth.getName())
                .orElseThrow(() -> new org.springframework.security.access.AccessDeniedException("Unauthorized"));
        if (!classroomSubjectRepository.existsByIdAndLecturerUserId(csId, actor.getUserId())) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
    }
}

package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateLearningNodeRequest;
import com.fedu.fedu.dto.req.CreateLearningPathRequest;
import com.fedu.fedu.dto.req.UpdateLearningNodeRequest;
import com.fedu.fedu.dto.req.UpdateLearningPathRequest;
import com.fedu.fedu.dto.req.ScheduleNodeRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ScheduleConflictException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.utils.NodeRoutingUtils;
import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeType;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
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
    private final NodeMaterialRepository nodeMaterialRepository;
    private final VideoRepository videoRepository;
    private final FileEntityRepository fileEntityRepository;
    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerRepository testAnswerRepository;
    private final NodeExerciseRepository nodeExerciseRepository;
    private final SlotRepository slotRepository;

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

    @Override
    @Transactional
    public LearningPathResponse cloneLearningPath(Long classroomSubjectId, Long templatePathId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);

        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom-subject not found"));

        if (!"published".equalsIgnoreCase(cs.getSubject().getStatus())) {
            throw new InvalidDataException("Môn học chưa được xuất bản — không thể clone lộ trình cho lớp.");
        }

        List<LearningPath> existingPaths = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);
        if (!existingPaths.isEmpty()) {
            throw new InvalidDataException("Lớp-môn đã có lộ trình. Xóa draft/unpublish trước.");
        }

        
        if (templatePathId == null) {
            List<LearningPath> candidates = learningPathRepository
                    .findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(cs.getSubject().getSubjectId())
                    .stream()
                    .filter(this::isPathPublishable)
                    .collect(Collectors.toList());
            if (candidates.isEmpty()) {
                throw new InvalidDataException("Môn chưa có lộ trình mẫu đạt điều kiện để clone.");
            }
            if (candidates.size() > 1) {
                throw new InvalidDataException("Môn có nhiều lộ trình mẫu — cần chọn lộ trình cụ thể để clone.");
            }
            templatePathId = candidates.get(0).getPathId();
        }

        LearningPath template = learningPathRepository.findById(templatePathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path template not found"));
        if (template.getClassroomSubject() != null || Boolean.TRUE.equals(template.getIsDeleted())
                || template.getSubject() == null
                || !template.getSubject().getSubjectId().equals(cs.getSubject().getSubjectId())) {
            throw new InvalidDataException("Lộ trình mẫu không hợp lệ cho môn của lớp-môn này.");
        }

        List<LearningNode> templateNodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(template.getPathId());
        List<NodeEdge> templateEdges = nodeEdgeRepository.findByFromNodeLearningPathPathId(template.getPathId());
        validateAndGetEntryNodes(templateNodes, templateEdges);

        LearningPath clonedPath = LearningPath.builder()
                .subject(template.getSubject())
                .classroomSubject(cs)
                .pathName(template.getPathName())
                .description(template.getDescription())
                .isDeleted(false)
                .build();
        learningPathRepository.save(clonedPath);

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
                    .stageOrder(tn.getStageOrder())
                    .level(tn.getLevel())
                    .testKind(tn.getTestKind())
                    .appliesLevels(tn.getAppliesLevels())
                    .gateUpMin(tn.getGateUpMin())
                    .gateDownMax(tn.getGateDownMax())
                    .placementYeuMax(tn.getPlacementYeuMax())
                    .placementTbMax(tn.getPlacementTbMax())
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
                        .fromNode(f).toNode(t).build());
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
        
        for (NodeExercise ex : nodeExerciseRepository.findByLearningNodeNodeIdAndIsDeletedFalse(src.getNodeId())) {
            nodeExerciseRepository.save(NodeExercise.builder()
                    .learningNode(dst)
                    .title(ex.getTitle())
                    .instructions(ex.getInstructions())
                    .allowText(ex.getAllowText())
                    .allowFile(ex.getAllowFile())
                    .orderIndex(ex.getOrderIndex())
                    .isDeleted(false)
                    .build());
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
                .findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    //  Learning Node

    @Override
    @Transactional
    public LearningNodeResponse createLearningNode(CreateLearningNodeRequest request) {
        Long pathId = request.getLearningPathId() != null ? request.getLearningPathId() : request.getClassroomPathId();
        if (pathId == null) {
            throw new InvalidDataException("Path ID must not be null");
        }
        LearningPath learningPath = learningPathRepository.findById(pathId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning path not found"));

        if (request.getNodeType() == NodeType.ON_CLASS && learningPath.getClassroomSubject() != null) {
            throw new InvalidDataException("Chỉ admin được tạo node loại 'Trên lớp' (chỉ trên lộ trình gốc)");
        }

        if (request.getStageOrder() != null && request.getStageOrder() < 1) {
            throw new InvalidDataException("stageOrder phải >= 1");
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
                .stageOrder(request.getStageOrder())
                .level(request.getLevel())
                .testKind(request.getTestKind() != null ? request.getTestKind() : com.fedu.fedu.utils.enums.NodeTestKind.NONE)
                .appliesLevels(request.getAppliesLevels())
                .gateUpMin(request.getGateUpMin())
                .gateDownMax(request.getGateDownMax())
                .placementYeuMax(request.getPlacementYeuMax())
                .placementTbMax(request.getPlacementTbMax())
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
        if (request.getDescription() != null) node.setDescription(request.getDescription());
        node.setNodeType(request.getNodeType());
        if (request.getStatus() != null) node.setStatus(request.getStatus());
        node.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : node.getDisplayOrder());
        node.setIsRequired(request.getIsRequired() != null ? request.getIsRequired() : node.getIsRequired());
        if (request.getStageOrder() != null) node.setStageOrder(request.getStageOrder());
        if (request.getLevel() != null) node.setLevel(request.getLevel());
        if (request.getTestKind() != null) node.setTestKind(request.getTestKind());
        if (request.getAppliesLevels() != null) node.setAppliesLevels(request.getAppliesLevels());
        if (request.getGateUpMin() != null) node.setGateUpMin(request.getGateUpMin());
        if (request.getGateDownMax() != null) node.setGateDownMax(request.getGateDownMax());
        if (request.getPlacementYeuMax() != null) node.setPlacementYeuMax(request.getPlacementYeuMax());
        if (request.getPlacementTbMax() != null) node.setPlacementTbMax(request.getPlacementTbMax());

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
        List<LearningPath> paths = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);
        List<LearningNodeResponse> allNodes = new ArrayList<>();
        for (LearningPath path : paths) {
            List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
            for (LearningNode node : nodes) {
                allNodes.add(mapToLearningNodeResponse(node));
            }
        }
        return allNodes;
    }

    private LearningPathResponse mapToResponse(LearningPath learningPath) {
        return LearningPathResponse.builder()
                .pathId(learningPath.getPathId())
                .subjectId(learningPath.getSubject() != null ? learningPath.getSubject().getSubjectId() : null)
                .pathName(learningPath.getPathName())
                .description(learningPath.getDescription())
                .createdById(learningPath.getCreatedBy() != null ? learningPath.getCreatedBy().getUserId() : null)
                .classroomSubjectId(learningPath.getClassroomSubject() != null ? learningPath.getClassroomSubject().getId() : null)
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
                .isDeleted(node.getIsDeleted())
                .stageOrder(node.getStageOrder())
                .level(node.getLevel())
                .testKind(node.getTestKind())
                .appliesLevels(node.getAppliesLevels())
                .gateUpMin(node.getGateUpMin())
                .gateDownMax(node.getGateDownMax())
                .placementYeuMax(node.getPlacementYeuMax())
                .placementTbMax(node.getPlacementTbMax())
                .studyDate(node.getStudyDate())
                .slotId(node.getSlot() != null ? node.getSlot().getSlotId() : null)
                .slotName(node.getSlot() != null ? node.getSlot().getSlotName() : null)
                .startTime(node.getSlot() != null ? node.getSlot().getStartTime() : null)
                .endTime(node.getSlot() != null ? node.getSlot().getEndTime() : null)
                .createdAt(node.getCreatedAt())
                .updatedAt(node.getUpdatedAt())
                .build();
    }

    private NodeEdgeResponse mapToEdgeResponse(NodeEdge e) {
        return NodeEdgeResponse.builder()
                .edgeId(e.getEdgeId())
                .fromNodeId(e.getFromNode().getNodeId())
                .toNodeId(e.getToNode().getNodeId())
                .build();
    }

    private boolean isPathPublishable(LearningPath path) {
        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        if (nodes.isEmpty()) {
            return false;
        }
        Map<Integer, Set<Integer>> specificByStage = new HashMap<>();
        for (LearningNode n : nodes) {
            if (n.getStageOrder() == null) {
                continue;
            }
            boolean isLearning = n.getTestKind() == null
                    || n.getTestKind() == com.fedu.fedu.utils.enums.NodeTestKind.NONE;
            if (isLearning && n.getLevel() != null) {
                specificByStage.computeIfAbsent(n.getStageOrder(), k -> new HashSet<>()).add(n.getLevel());
            }
        }
        for (Set<Integer> levels : specificByStage.values()) {
            if (!levels.contains(1) || !levels.contains(2) || !levels.contains(3)) {
                return false;
            }
        }
        return true;
    }

    @Override
    @Transactional(readOnly = true)
    public ClassroomGraphResponse getClassroomGraph(Long classroomSubjectId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Classroom-subject not found"));

        List<LearningPath> paths = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);

        if (paths.isEmpty()) {
            // Chỉ liệt kê lộ trình đạt điều kiện xuất bản — teacher không thấy/clone bản nháp.
            List<LearningPath> templates = learningPathRepository
                    .findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(cs.getSubject().getSubjectId())
                    .stream()
                    .filter(this::isPathPublishable)
                    .collect(Collectors.toList());

            boolean subjectPublished = "published".equalsIgnoreCase(cs.getSubject().getStatus());
            boolean canClone = subjectPublished && !templates.isEmpty();

            List<AvailableTemplateResponse> availableTemplates = templates.stream()
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
                    .paths(Collections.emptyList())
                    .canCloneAll(canClone)
                    .missingLevels(Collections.emptyList())
                    .availableTemplates(availableTemplates)
                    .quizStartTestId(cs.getQuizStart() != null ? cs.getQuizStart().getTestId() : null)
                    .build();
        }

        LearningPath path = paths.get(0);
        String state = path.getPublishedAt() == null ? "DRAFT" : "PUBLISHED";

        List<LearningNodeResponse> nodeResponses = learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalse(path.getPathId())
                .stream().map(this::mapToLearningNodeResponse).collect(Collectors.toList());
        List<NodeEdgeResponse> edgeResponses = nodeEdgeRepository
                .findByFromNodeLearningPathPathId(path.getPathId())
                .stream().map(this::mapToEdgeResponse).collect(Collectors.toList());

        ClassroomPathDto pathDto = ClassroomPathDto.builder()
                .pathId(path.getPathId())
                .nodes(nodeResponses)
                .edges(edgeResponses)
                .build();

        List<AvailableTemplateResponse> draftTemplates = null;
        if ("DRAFT".equals(state)) {
            draftTemplates = learningPathRepository
                    .findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(cs.getSubject().getSubjectId())
                    .stream()
                    .filter(this::isPathPublishable)
                    .map(t -> AvailableTemplateResponse.builder()
                            .pathId(t.getPathId())
                            .pathName(t.getPathName())
                            .description(t.getDescription())
                            .nodeCount(learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(t.getPathId()).size())
                            .lastUpdatedAt(t.getUpdatedAt())
                            .build())
                    .collect(Collectors.toList());
        }

        return ClassroomGraphResponse.builder()
                .classroomSubjectId(classroomSubjectId)
                .state(state)
                .pathId(path.getPathId())
                .publishedAt(path.getPublishedAt())
                .nodes(nodeResponses)
                .edges(edgeResponses)
                .paths(Collections.singletonList(pathDto))
                .canCloneAll(false)
                .missingLevels(Collections.emptyList())
                .availableTemplates(draftTemplates)
                .quizStartTestId(cs.getQuizStart() != null ? cs.getQuizStart().getTestId() : null)
                .build();
    }

    @Override
    @Transactional
    public PublishResultResponse publishClassroomPath(Long classroomSubjectId, Long pathId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException("Lớp-môn học không tồn tại"));
        if (cs.getQuizStart() == null) {
            throw new InvalidDataException("Vui lòng khởi tạo và cấu hình bài test phân loại đầu vào trước khi xuất bản lộ trình.");
        }

        List<LearningPath> paths = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);
        if (paths.isEmpty()) {
            throw new ResourceNotFoundException("No learning paths found for this classroom subject");
        }
        LearningPath path = paths.get(0);
        if (path.getPublishedAt() != null) {
            throw new InvalidDataException("Lộ trình đã được publish trước đó.");
        }

        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
        validateAndGetEntryNodes(nodes, edges);
        validateLevelTraversability(nodes, edges);

        String email = "";
        try {
            email = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getName();
        } catch (Exception e) {}
        UserAccount teacher = userAccountRepository.findByEmail(email).orElse(null);

        path.setPublishedAt(LocalDateTime.now());
        path.setPublishedBy(teacher);
        learningPathRepository.save(path);

        List<UserAccount> students = classroomSubjectStudentRepository.findDistinctStudentsByClassroomSubjectId(classroomSubjectId);
        int seededCount = 0;
        for (UserAccount student : students) {
            ClassroomSubjectStudent css = classroomSubjectStudentRepository
                    .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, student.getUserId())
                    .orElse(null);
            if (css != null && css.getCurrentLevel() != null) {
                backfillProgressForStudent(classroomSubjectId, student.getUserId());
                seededCount++;
            }
        }

        return PublishResultResponse.builder().seededStudents(seededCount).build();
    }

    private void validateLevelTraversability(List<LearningNode> nodes, List<NodeEdge> edges) {
        boolean hasLeveled = nodes.stream().anyMatch(n -> n.getLevel() != null);
        if (!hasLeveled) {
            return;
        }

        Map<Long, List<LearningNode>> outgoing = new HashMap<>();
        for (NodeEdge e : edges) {
            outgoing.computeIfAbsent(e.getFromNode().getNodeId(), k -> new ArrayList<>())
                    .add(e.getToNode());
        }
        Set<Long> withIncoming = edges.stream()
                .map(e -> e.getToNode().getNodeId()).collect(Collectors.toSet());
        Set<Long> entryIds = nodes.stream().map(LearningNode::getNodeId)
                .filter(id -> !withIncoming.contains(id)).collect(Collectors.toSet());

        Map<Long, LearningNode> byId = nodes.stream()
                .collect(Collectors.toMap(LearningNode::getNodeId, n -> n, (a, b) -> a));

        for (int level = 1; level <= 3; level++) {
            final int lv = level;

            // Node "hiện" với mức lv = node chung (level null) hoặc đúng mức lv.
            List<LearningNode> entries = nodes.stream()
                    .filter(n -> entryIds.contains(n.getNodeId()) && isVisibleForLevel(n, lv))
                    .collect(Collectors.toList());

            if (entries.isEmpty()) {
                throw new InvalidDataException("Lộ trình không có node bắt đầu cho học sinh mức "
                        + levelName(lv) + " — mức này sẽ không vào học được.");
            }

            // BFS từ entry của mức, chỉ đi qua node "hiện" với mức → tập node THỰC SỰ tới được.
            // Node chung nằm trên nhánh của mức khác (vd Test chung chỉ nối Yếu/TB) sẽ không
            // reachable cho mức Khá nên không bị coi là "kẹt".
            Set<Long> reachable = new HashSet<>();
            Deque<LearningNode> queue = new ArrayDeque<>(entries);
            entries.forEach(n -> reachable.add(n.getNodeId()));
            while (!queue.isEmpty()) {
                LearningNode cur = queue.poll();
                for (LearningNode next : outgoing.getOrDefault(cur.getNodeId(), Collections.emptyList())) {
                    if (isVisibleForLevel(next, lv) && reachable.add(next.getNodeId())) {
                        queue.add(next);
                    }
                }
            }

            // Chỉ kiểm node reachable cho mức: có nhánh đi tiếp nhưng không nhánh nào "hiện" → kẹt.
            for (Long id : reachable) {
                LearningNode n = byId.get(id);
                List<LearningNode> outs = outgoing.getOrDefault(id, Collections.emptyList());
                if (outs.isEmpty()) {
                    continue;
                }
                boolean hasVisibleNext = outs.stream().anyMatch(t -> isVisibleForLevel(t, lv));
                if (!hasVisibleNext) {
                    throw new InvalidDataException("Lộ trình bị kẹt ở node '" + n.getTitle()
                            + "' cho học sinh mức " + levelName(lv)
                            + ": node có nhánh đi tiếp nhưng không nhánh nào dành cho mức này.");
                }
            }
        }
    }

    /** Node "hiện" (đi được) với một mức: node chung (level null) hoặc đúng mức đó. */
    private static boolean isVisibleForLevel(LearningNode n, int level) {
        return n.getLevel() == null || n.getLevel().equals(level);
    }

    private String levelName(int level) {
        return level == 1 ? "Yếu" : level == 2 ? "Trung bình" : "Khá";
    }

    private boolean anyStudentPlaced(Long classroomSubjectId) {
        return classroomSubjectStudentRepository
                .findDistinctStudentsByClassroomSubjectId(classroomSubjectId)
                .stream()
                .anyMatch(s -> classroomSubjectStudentRepository
                        .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, s.getUserId())
                        .map(css -> css.getCurrentLevel() != null)
                        .orElse(false));
    }

    @Override
    @Transactional
    public void unpublishClassroomPath(Long classroomSubjectId, Long pathId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        List<LearningPath> paths = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);
        if (paths.isEmpty()) {
            throw new ResourceNotFoundException("No learning paths found for this classroom subject");
        }

        if (anyStudentPlaced(classroomSubjectId)) {
            throw new InvalidDataException("Đã có học sinh được phân loại (làm placement), không thể unpublish.");
        }

        LearningPath path = paths.get(0);
        if (path.getPublishedAt() == null) {
            throw new InvalidDataException("Lộ trình chưa được publish.");
        }
        boolean hasCompleted = studentNodeProgressRepository.existsByLearningPathPathIdAndStatus(path.getPathId(), StudentProgressStatus.COMPLETED);
        if (hasCompleted) {
            throw new InvalidDataException("Đã có học sinh hoàn thành node, không thể unpublish.");
        }
        studentNodeProgressRepository.deleteAllByLearningPathPathId(path.getPathId());
        path.setPublishedAt(null);
        path.setPublishedBy(null);
        learningPathRepository.save(path);
    }

    @Override
    @Transactional
    public void deleteDraftPath(Long classroomSubjectId, Long pathId) {
        assertTeacherOwnsClassroomSubject(classroomSubjectId);
        List<LearningPath> paths = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectId);
        if (paths.isEmpty()) {
            throw new ResourceNotFoundException("No learning paths found for this classroom subject");
        }

        if (anyStudentPlaced(classroomSubjectId)) {
            throw new InvalidDataException("Đã có học sinh được phân loại (làm placement), không thể xóa.");
        }

        LearningPath path = paths.get(0);
        if (path.getPublishedAt() != null) {
            throw new InvalidDataException("Không thể xóa lộ trình đã publish. Unpublish trước.");
        }
        path.setIsDeleted(true);
        learningPathRepository.save(path);
        for (LearningNode node : learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId())) {
            node.setIsDeleted(true);
            learningNodeRepository.save(node);
        }
    }

    @Override
    @Transactional
    public void backfillProgressForStudent(Long classroomSubjectId, Long studentId) {
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, studentId)
                .orElse(null);
        if (css == null || css.getCurrentLevel() == null) {
            return;
        }
        LearningPath path = learningPathRepository
                .findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(classroomSubjectId)
                .orElse(null);
        if (path == null || path.getPublishedAt() == null) {
            return;
        }

        if (!studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId()).isEmpty()) {
            return;
        }

        Integer level = css.getCurrentLevel();
        List<LearningNode> nodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
        List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
        List<LearningNode> entryNodes = validateAndGetEntryNodes(nodes, edges);

        List<StudentNodeProgress> progressList = new ArrayList<>();
        for (LearningNode node : nodes) {
            boolean levelOk = node.getLevel() == null || node.getLevel().equals(level);
            boolean openIt = entryNodes.contains(node) && (node.getNodeType() != NodeType.ON_CLASS || node.getStatus() == NodeStatus.OPEN) && levelOk;
            progressList.add(StudentNodeProgress.builder()
                    .classroomSubjectStudent(css)
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

        node.setStatus(NodeStatus.OPEN);
        learningNodeRepository.save(node);

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

            // Lấy thông tin lớp học sinh để biết level hiện tại
            ClassroomSubjectStudent css = classroomSubjectStudentRepository
                    .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectId, student.getUserId())
                    .orElse(null);
            if (css == null || css.getCurrentLevel() == null) continue;
            Integer studentLevel = css.getCurrentLevel();

            // Tôn trọng điều kiện tiên quyết: chỉ mở cho học sinh đã hoàn thành các node trước (bỏ qua các node của level khác)
            boolean prereqMet = NodeRoutingUtils.incomingPrereqMet(incoming, statusMap, studentLevel);
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

    @Override
    @Transactional(readOnly = true)
    public List<StudentInClassResponse> getNodeStudents(Long nodeId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found"));
        LearningPath path = node.getLearningPath();
        if (path == null || path.getClassroomSubject() == null) {
            return Collections.emptyList();
        }
        
        List<StudentNodeProgress> progressList = studentNodeProgressRepository.findByLearningNodeNodeId(nodeId);
        List<StudentInClassResponse> responses = new ArrayList<>();
        for (StudentNodeProgress p : progressList) {
            ClassroomSubjectStudent css = p.getClassroomSubjectStudent();
            UserAccount student = css.getStudent();
            responses.add(StudentInClassResponse.builder()
                    .userId(student.getUserId())
                    .email(student.getEmail())
                    .firstName(student.getFirstName())
                    .lastName(student.getLastName())
                    .avatarUrl(student.getAvatarUrl())
                    .joinedAt(css.getCreatedAt())
                    .currentLevel(css.getCurrentLevel())
                    .classroomSubjectStudentId(css.getId())
                    .build());
        }
        return responses;
    }

    @Override
    @Transactional
    public void assignStudentsToNode(Long nodeId, List<Long> studentUserIds) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Node not found"));
        LearningPath path = node.getLearningPath();
        if (path == null || path.getClassroomSubject() == null) {
            throw new InvalidDataException("Node không thuộc lộ trình lớp học");
        }
        assertTeacherOwnsClassroomSubject(path.getClassroomSubject().getId());

        Long csId = path.getClassroomSubject().getId();
        Integer stage = node.getStageOrder();
        
        // Find other nodes in the same stage (row)
        List<LearningNode> sameStageNodes = learningNodeRepository
                .findByLearningPathPathIdAndIsDeletedFalse(path.getPathId())
                .stream()
                .filter(n -> Objects.equals(n.getStageOrder(), stage))
                .collect(Collectors.toList());

        List<ClassroomSubjectStudent> enrolledStudents = classroomSubjectStudentRepository.findAllByClassroomSubjectId(csId);
        Set<Long> assignSet = studentUserIds != null ? new HashSet<>(studentUserIds) : Collections.emptySet();

        for (ClassroomSubjectStudent css : enrolledStudents) {
            Long studentId = css.getStudent().getUserId();
            boolean shouldAssign = assignSet.contains(studentId);

            if (shouldAssign) {
                // Remove progress records for other nodes in the same stage
                for (LearningNode otherNode : sameStageNodes) {
                    if (!otherNode.getNodeId().equals(nodeId)) {
                        List<StudentNodeProgress> list = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
                        for (StudentNodeProgress p : list) {
                            if (p.getLearningNode().getNodeId().equals(otherNode.getNodeId())) {
                                studentNodeProgressRepository.delete(p);
                            }
                        }
                    }
                }
                
                // Ensure progress record exists for target node
                List<StudentNodeProgress> list = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
                boolean exists = list.stream().anyMatch(p -> p.getLearningNode().getNodeId().equals(nodeId));
                if (!exists) {
                    // Find entry nodes to decide whether to open it
                    List<LearningNode> allNodes = learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(path.getPathId());
                    List<NodeEdge> edges = nodeEdgeRepository.findByFromNodeLearningPathPathId(path.getPathId());
                    List<LearningNode> entryNodes = validateAndGetEntryNodes(allNodes, edges);
                    
                    boolean openIt = entryNodes.contains(node) && (node.getNodeType() != NodeType.ON_CLASS || node.getStatus() == NodeStatus.OPEN);
                    StudentNodeProgress progress = StudentNodeProgress.builder()
                            .classroomSubjectStudent(css)
                            .learningNode(node)
                            .learningPath(path)
                            .orderIndex(node.getDisplayOrder() != null ? node.getDisplayOrder() : 0)
                            .status(openIt ? StudentProgressStatus.OPEN : StudentProgressStatus.LOCKED)
                            .unlockedAt(openIt ? LocalDateTime.now() : null)
                            .build();
                    studentNodeProgressRepository.save(progress);
                }
            } else {
                // If not assigned, ensure no progress record exists for target node
                List<StudentNodeProgress> list = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
                for (StudentNodeProgress p : list) {
                    if (p.getLearningNode().getNodeId().equals(nodeId)) {
                        studentNodeProgressRepository.delete(p);
                    }
                }
            }
        }
    }

    @Override
    @Transactional
    public LearningNodeResponse scheduleNode(Long nodeId, ScheduleNodeRequest request) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài học với id: " + nodeId));

        LearningPath path = node.getLearningPath();
        if (path.getClassroomSubject() == null) {
            throw new InvalidDataException("Không thể xếp lịch cho bài học thuộc lộ trình mẫu");
        }

        assertTeacherOwnsClassroomSubject(path.getClassroomSubject().getId());

        if (request.getStudyDate() == null || request.getSlotId() == null) {
            // Xóa lịch học
            node.setStudyDate(null);
            node.setSlot(null);
            learningNodeRepository.save(node);
            return mapToLearningNodeResponse(node);
        }

        Slot slot = slotRepository.findById(request.getSlotId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca học với id: " + request.getSlotId()));

        Long csId = path.getClassroomSubject().getId();
        Long lecturerId = path.getClassroomSubject().getLecturer().getUserId();

        // 1. Kiểm tra trùng lịch giảng viên (KHÔNG cho phép ghi đè kể cả force = true)
        List<LearningNode> teacherClashes = learningNodeRepository.findTeacherConflicts(
                lecturerId, request.getStudyDate(), request.getSlotId(), nodeId
        );
        String teacherMsg = null;
        if (!teacherClashes.isEmpty()) {
            LearningNode clashNode = teacherClashes.get(0);
            teacherMsg = String.format("Giảng viên đã có lịch dạy lớp '%s' (môn %s, bài '%s') vào ca học này.",
                    clashNode.getLearningPath().getClassroomSubject().getClassroom().getClassName(),
                    clashNode.getLearningPath().getClassroomSubject().getSubject().getSubjectCode(),
                    clashNode.getTitle());
        }

        if (teacherMsg != null) {
            throw new InvalidDataException("Không thể xếp lịch học: " + teacherMsg + " Lịch trùng của giảng viên không được phép ghi đè.");
        }

        // 2. Kiểm tra trùng lịch sinh viên (cho phép ghi đè bằng cờ force)
        if (!request.isForce()) {
            List<ClassroomSubjectStudent> enrolledStudents = classroomSubjectStudentRepository.findAllByClassroomSubjectId(csId);
            List<StudentConflictDto> studentConflicts = new ArrayList<>();
            if (!enrolledStudents.isEmpty()) {
                List<Long> studentIds = enrolledStudents.stream()
                        .map(css -> css.getStudent().getUserId())
                        .collect(Collectors.toList());

                List<LearningNode> studentClashes = learningNodeRepository.findStudentsConflicts(
                        studentIds, request.getStudyDate(), request.getSlotId(), csId
                );

                for (LearningNode cn : studentClashes) {
                    List<ClassroomSubjectStudent> clashCssList = classroomSubjectStudentRepository.findAllByClassroomSubjectId(
                            cn.getLearningPath().getClassroomSubject().getId()
                    );
                    Set<Long> clashStudentIds = clashCssList.stream()
                            .map(css -> css.getStudent().getUserId())
                            .collect(Collectors.toSet());

                    for (ClassroomSubjectStudent css : enrolledStudents) {
                        if (clashStudentIds.contains(css.getStudent().getUserId())) {
                            studentConflicts.add(StudentConflictDto.builder()
                                    .studentId(css.getStudent().getUserId())
                                    .studentName(css.getStudent().getFirstName() + " " + css.getStudent().getLastName())
                                    .email(css.getStudent().getEmail())
                                    .conflictingSubjectName(cn.getLearningPath().getClassroomSubject().getSubject().getSubjectName())
                                    .conflictingClassName(cn.getLearningPath().getClassroomSubject().getClassroom().getClassName())
                                    .build());
                        }
                    }
                }
            }

            if (!studentConflicts.isEmpty()) {
                ScheduleConflictResponse conflictResponse = ScheduleConflictResponse.builder()
                        .hasConflict(true)
                        .teacherConflictMessage(null) // Giảng viên không trùng (vì đã bị chặn ở trên)
                        .studentConflicts(studentConflicts)
                        .build();
                throw new ScheduleConflictException(conflictResponse);
            }
        }

        // Lưu lịch học
        node.setStudyDate(request.getStudyDate());
        node.setSlot(slot);
        learningNodeRepository.save(node);

        return mapToLearningNodeResponse(node);
    }
}

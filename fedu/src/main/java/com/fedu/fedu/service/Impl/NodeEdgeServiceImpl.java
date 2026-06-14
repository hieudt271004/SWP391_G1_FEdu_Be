package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateNodeEdgeRequest;
import com.fedu.fedu.dto.res.NodeEdgeResponse;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.NodeEdge;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.NodeEdgeRepository;
import com.fedu.fedu.service.NodeEdgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NodeEdgeServiceImpl implements NodeEdgeService {

    private final NodeEdgeRepository nodeEdgeRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    @Override
    @Transactional
    public NodeEdgeResponse createEdge(CreateNodeEdgeRequest request) {
        if (nodeEdgeRepository.existsByFromNodeNodeIdAndToNodeNodeId(request.getFromNodeId(), request.getToNodeId())) {
            throw new InvalidDataException("Liên kết giữa hai bài học này đã tồn tại.");
        }

        LearningNode fromNode = learningNodeRepository.findById(request.getFromNodeId())
                .orElseThrow(() -> new ResourceNotFoundException("From node not found"));

        LearningNode toNode = learningNodeRepository.findById(request.getToNodeId())
                .orElseThrow(() -> new ResourceNotFoundException("To node not found"));

        NodeEdge edge = NodeEdge.builder()
                .fromNode(fromNode)
                .toNode(toNode)
                .branchName(request.getBranchName())
                .minScore(request.getMinScore())
                .maxScore(request.getMaxScore())
                .build();

        nodeEdgeRepository.save(edge);
        nodeEdgeRepository.flush();

        // If the path is published, update student progress
        LearningPath path = toNode.getLearningPath();
        if (path.getClassroom() != null && path.getPublishedAt() != null) {
            List<UserAccount> students = classroomSubjectStudentRepository.findDistinctStudentsByClassroomId(path.getClassroom().getClassroomId());
            for (UserAccount student : students) {
                StudentNodeProgress fromProgress = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(student.getUserId(), path.getPathId())
                        .stream()
                        .filter(p -> p.getLearningNode().getNodeId().equals(fromNode.getNodeId()))
                        .findFirst()
                        .orElse(null);
                
                StudentNodeProgress toProgress = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(student.getUserId(), path.getPathId())
                        .stream()
                        .filter(p -> p.getLearningNode().getNodeId().equals(toNode.getNodeId()))
                        .findFirst()
                        .orElse(null);
                
                if (toProgress != null) {
                    if (fromProgress == null || fromProgress.getStatus() != StudentProgressStatus.COMPLETED) {
                        toProgress.setStatus(StudentProgressStatus.LOCKED);
                        toProgress.setUnlockedAt(null);
                        studentNodeProgressRepository.save(toProgress);
                    }
                }
            }
        }

        return mapToEdgeResponse(edge);
    }

    @Override
    @Transactional
    public void deleteEdge(Long edgeId) {
        NodeEdge edge = nodeEdgeRepository.findById(edgeId)
                .orElseThrow(() -> new ResourceNotFoundException("Edge not found"));
        
        LearningNode fromNode = edge.getFromNode();
        LearningNode toNode = edge.getToNode();
        LearningPath path = toNode.getLearningPath();
        
        nodeEdgeRepository.delete(edge);
        nodeEdgeRepository.flush();
        
        if (path.getClassroom() != null && path.getPublishedAt() != null) {
            List<UserAccount> students = classroomSubjectStudentRepository.findDistinctStudentsByClassroomId(path.getClassroom().getClassroomId());
            for (UserAccount student : students) {
                boolean prerequisitesMet = checkIncomingPrerequisites(student.getUserId(), toNode, path.getPathId());
                if (prerequisitesMet) {
                    StudentNodeProgress toProgress = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(student.getUserId(), path.getPathId())
                            .stream()
                            .filter(p -> p.getLearningNode().getNodeId().equals(toNode.getNodeId()))
                            .findFirst()
                            .orElse(null);
                    if (toProgress != null && toProgress.getStatus() == StudentProgressStatus.LOCKED) {
                        toProgress.setStatus(StudentProgressStatus.OPEN);
                        toProgress.setUnlockedAt(java.time.LocalDateTime.now());
                        studentNodeProgressRepository.save(toProgress);
                    }
                }
            }
        }
    }

    private boolean checkIncomingPrerequisites(Long studentId, LearningNode targetNode, Long pathId) {
        List<NodeEdge> incomingEdges = nodeEdgeRepository.findByToNodeNodeId(targetNode.getNodeId());
        List<StudentNodeProgress> progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, pathId);
        Map<Long, StudentProgressStatus> progressMap = progressList.stream()
                .collect(Collectors.toMap(
                        p -> p.getLearningNode().getNodeId(),
                        StudentNodeProgress::getStatus
                ));

        for (NodeEdge edge : incomingEdges) {
            StudentProgressStatus status = progressMap.get(edge.getFromNode().getNodeId());
            if (status != StudentProgressStatus.COMPLETED) {
                return false;
            }
        }
        return true;
    }

    @Override
    public List<NodeEdgeResponse> getEdgesByNodeId(List<Long> nodeId) {
        return nodeEdgeRepository.findByFromNodeNodeIdIn(nodeId)
                .stream()
                .map(this::mapToEdgeResponse)
                .collect(Collectors.toList());
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


}

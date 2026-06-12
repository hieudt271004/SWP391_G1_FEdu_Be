package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateNodeEdgeRequest;
import com.fedu.fedu.dto.res.NodeEdgeResponse;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.NodeEdge;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.NodeEdgeRepository;
import com.fedu.fedu.service.NodeEdgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NodeEdgeServiceImpl implements NodeEdgeService {

    private final NodeEdgeRepository nodeEdgeRepository;
    private final LearningNodeRepository learningNodeRepository;

    @Override
    @Transactional
    public NodeEdgeResponse createEdge(CreateNodeEdgeRequest request) {
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

        return mapToEdgeResponse(edge);
    }

    @Override
    @Transactional
    public void deleteEdge(Long edgeId) {
        NodeEdge edge = nodeEdgeRepository.findById(edgeId)
                .orElseThrow(() -> new ResourceNotFoundException("Edge not found"));
        nodeEdgeRepository.delete(edge);
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

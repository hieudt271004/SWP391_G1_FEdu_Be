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
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NodeEdgeServiceImpl implements NodeEdgeService {

    private final NodeEdgeRepository nodeEdgeRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final TemplateEditGuard templateEditGuard;

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

        templateEditGuard.assertNodeEditable(fromNode);

        NodeEdge edge = NodeEdge.builder()
                .fromNode(fromNode)
                .toNode(toNode)
                .build();

        nodeEdgeRepository.save(edge);

        return mapToEdgeResponse(edge);
    }

    @Override
    @Transactional
    public void deleteEdge(Long edgeId) {
        NodeEdge edge = nodeEdgeRepository.findById(edgeId)
                .orElseThrow(() -> new ResourceNotFoundException("Edge not found"));
        templateEditGuard.assertNodeEditable(edge.getFromNode());
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
                .build();
    }


}

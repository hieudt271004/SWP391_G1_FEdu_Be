package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateNodeEdgeRequest;
import com.fedu.fedu.dto.res.NodeEdgeResponse;

import java.util.List;

public interface NodeEdgeService {
    NodeEdgeResponse createEdge(CreateNodeEdgeRequest request);

    void deleteEdge(Long edgeId);

    List<NodeEdgeResponse> getEdgesByNodeId(List<Long> nodeId);
}

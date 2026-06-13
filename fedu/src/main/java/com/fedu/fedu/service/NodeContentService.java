package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateNodeMaterialRequest;
import com.fedu.fedu.dto.req.CreateNodeTestRequest;
import com.fedu.fedu.dto.res.NodeContentResponse;
import com.fedu.fedu.dto.res.NodeMaterialResponse;
import com.fedu.fedu.dto.res.NodeTestResponse;
import org.springframework.web.multipart.MultipartFile;

public interface NodeContentService {
    NodeContentResponse getNodeContent(Long nodeId);

    NodeMaterialResponse addMaterial(Long nodeId, CreateNodeMaterialRequest request, MultipartFile file);

    void deleteMaterial(Long materialId);

    NodeTestResponse addTest(Long nodeId, CreateNodeTestRequest request);

    void deleteTest(Long testId);
}

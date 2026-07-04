package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateNodeExerciseRequest;
import com.fedu.fedu.dto.req.CreateNodeMaterialRequest;
import com.fedu.fedu.dto.req.CreateNodeTestRequest;
import com.fedu.fedu.dto.req.ReorderContentRequest;
import com.fedu.fedu.dto.req.UpdateTestRequest;
import com.fedu.fedu.dto.res.NodeContentResponse;
import com.fedu.fedu.dto.res.NodeExerciseResponse;
import com.fedu.fedu.dto.res.NodeMaterialResponse;
import com.fedu.fedu.dto.res.NodeTestResponse;
import com.fedu.fedu.dto.res.StudentAttemptResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface NodeContentService {
    NodeContentResponse getNodeContent(Long nodeId);

    NodeMaterialResponse addMaterial(Long nodeId, CreateNodeMaterialRequest request, MultipartFile file);

    void deleteMaterial(Long materialId);

    NodeTestResponse addTest(Long nodeId, CreateNodeTestRequest request);

    void deleteTest(Long testId);

    NodeExerciseResponse addExercise(Long nodeId, CreateNodeExerciseRequest request);

    void deleteExercise(Long exerciseId);

    void reorderContent(Long nodeId, List<ReorderContentRequest> requests);

    NodeTestResponse updateTest(Long testId, UpdateTestRequest request);

    List<StudentAttemptResponse> getTestAttempts(Long testId);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.*;
import com.fedu.fedu.dto.res.*;

import java.util.List;

public interface LearningPathService {
    // learning path gốc
    LearningPathResponse createLearningPath(CreateLearningPathRequest request);

    LearningPathResponse updateLearningPath(Long pathId, UpdateLearningPathRequest request);

    void deleteLearningPath(Long pathId);

    LearningPathResponse getLearningPathById(Long pathId);

    List<LearningPathResponse> getLearningPathsBySubjectId(Long subjectId);

    // classroom path clone
    ClassroomLearningPathResponse cloneLearningPath(Long classroomId, Long pathId);

    List<ClassroomLearningPathResponse> getClassroomLearningPaths(Long classroomId);


    LearningNodeResponse createLearningNode(CreateLearningNodeRequest request);

    LearningNodeResponse updateLearningNode(Long nodeId, UpdateLearningNodeRequest request);

    void deleteLearningNode(Long nodeId);


    LearningNodeResponse getLearningNodeById(Long nodeId);

    List<LearningNodeResponse> getTemplateNodesByPathId(Long pathId);

    List<LearningNodeResponse> getTemplateNodesBySubjectId(Long subjectId);

    List<LearningNodeResponse> getClassroomNodesByClassroomPathId(Long classroomPathId);

    List<LearningNodeResponse> getClassroomNodesByClassroomId(Long classroomId);

//    NodeEdgeResponse createEdge(CreateNodeEdgeRequest request);
//
//    void deleteEdge(Long edgeId);
//
//    List<NodeEdgeResponse> getEdgesByNodeId(Long nodeId);

    LearningPathGraphResponse getLearningPathGraph(Long pathId);

    LearningPathGraphResponse getClassroomLearningPathGraph(Long classroomId);
}
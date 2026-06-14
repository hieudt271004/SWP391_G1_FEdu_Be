package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.*;
import com.fedu.fedu.dto.res.*;

import java.util.List;

public interface LearningPathService {

    // ── Learning Path (Template & Classroom) ──────────────────────────────────

    LearningPathResponse createLearningPath(CreateLearningPathRequest request);

    LearningPathResponse updateLearningPath(Long pathId, UpdateLearningPathRequest request);

    void deleteLearningPath(Long pathId);

    LearningPathResponse getLearningPathById(Long pathId);

    List<LearningPathResponse> getLearningPathsBySubjectId(Long subjectId);

    /**
     * Clone lộ trình mẫu thành lộ trình riêng cho lớp học.
     * Trả về LearningPathResponse (bảng classroom_learning_path đã gộp vào learning_paths).
     */
    LearningPathResponse cloneLearningPath(Long classroomId, Long pathId);

    /**
     * Lấy danh sách các lộ trình đã clone riêng cho lớp học.
     */
    List<LearningPathResponse> getClassroomLearningPaths(Long classroomId);

    // ── Learning Node ─────────────────────────────────────────────────────────

    LearningNodeResponse createLearningNode(CreateLearningNodeRequest request);

    LearningNodeResponse updateLearningNode(Long nodeId, UpdateLearningNodeRequest request);

    void deleteLearningNode(Long nodeId);

    LearningNodeResponse getLearningNodeById(Long nodeId);

    List<LearningNodeResponse> getTemplateNodesByPathId(Long pathId);

    List<LearningNodeResponse> getClassroomNodesByClassroomId(Long classroomId);

    // ── Graph View ────────────────────────────────────────────────────────────

    LearningPathGraphResponse getLearningPathGraph(Long pathId);

    ClassroomGraphResponse getClassroomGraph(Long classroomId);

    PublishResultResponse publishClassroomPath(Long classroomId, Long pathId);

    void unpublishClassroomPath(Long classroomId, Long pathId);

    void deleteDraftPath(Long classroomId, Long pathId);

    void backfillProgressForStudent(Long classroomId, Long studentId);

    LearningPathResponse publishTemplate(Long pathId);

    LearningPathResponse unpublishTemplate(Long pathId);
}
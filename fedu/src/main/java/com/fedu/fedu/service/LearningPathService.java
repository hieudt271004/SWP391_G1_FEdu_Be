package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.*;
import com.fedu.fedu.dto.res.*;

import java.util.List;

public interface LearningPathService {

    // ── Learning Path (template) ──────────────────────────────────────────────
    List<LearningPathResponse> getLearningPathsBySubjectId(Long subjectId);
    LearningPathResponse createLearningPath(CreateLearningPathRequest request);
    LearningPathResponse updateLearningPath(Long pathId, UpdateLearningPathRequest request);
    void deleteLearningPath(Long pathId);
    LearningPathResponse getLearningPathById(Long pathId);

    // ── Clone về lớp-môn (classroom_subject) ─────────────────────────────────
    LearningPathResponse cloneLearningPath(Long classroomSubjectId, Long templatePathId);
    List<LearningPathResponse> getClassroomLearningPaths(Long classroomSubjectId);

    // ── Learning Node ─────────────────────────────────────────────────────────
    LearningNodeResponse createLearningNode(CreateLearningNodeRequest request);
    LearningNodeResponse updateLearningNode(Long nodeId, UpdateLearningNodeRequest request);
    void deleteLearningNode(Long nodeId);
    LearningNodeResponse getLearningNodeById(Long nodeId);
    List<LearningNodeResponse> getTemplateNodesByPathId(Long pathId);
    List<LearningNodeResponse> getClassroomNodesByClassroomId(Long classroomSubjectId);

    // ── Graph ─────────────────────────────────────────────────────────────────
    LearningPathGraphResponse getLearningPathGraph(Long pathId);
    ClassroomGraphResponse getClassroomGraph(Long classroomSubjectId);

    // ── Publish / Progress ────────────────────────────────────────────────────
    PublishResultResponse publishClassroomPath(Long classroomSubjectId, Long pathId);
    void unpublishClassroomPath(Long classroomSubjectId, Long pathId);
    void deleteDraftPath(Long classroomSubjectId, Long pathId);
    void backfillProgressForStudent(Long classroomSubjectId, Long studentId);

    /** Giáo viên mở khóa 1 node "Trên lớp" cho cả lớp-môn; trả về số học sinh được mở. */
    int unlockOnClassNode(Long classroomSubjectId, Long nodeId);

    List<StudentInClassResponse> getNodeStudents(Long nodeId);
    void assignStudentsToNode(Long nodeId, List<Long> studentUserIds);

    LearningNodeResponse scheduleNode(Long nodeId, com.fedu.fedu.dto.req.ScheduleNodeRequest request);
}

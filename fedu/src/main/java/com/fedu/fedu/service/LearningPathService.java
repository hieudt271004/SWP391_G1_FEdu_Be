package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.*;
import com.fedu.fedu.dto.res.*;

import java.util.List;

public interface LearningPathService {

    
    List<LearningPathResponse> getLearningPathsBySubjectId(Long subjectId);
    
    List<LearningPathResponse> getTemplatesVisibleToTeacher(Long subjectId);
    LearningPathResponse createLearningPath(CreateLearningPathRequest request);
    LearningPathResponse updateLearningPath(Long pathId, UpdateLearningPathRequest request);
    void deleteLearningPath(Long pathId);
    LearningPathResponse getLearningPathById(Long pathId);

    
    LearningPathResponse cloneLearningPath(Long classroomSubjectId, Long templatePathId);
    
    LearningPathResponse replaceDraftWithTemplate(Long classroomSubjectId, Long templatePathId);
    List<LearningPathResponse> getClassroomLearningPaths(Long classroomSubjectId);
    List<CloneablePathResponse> getCloneablePaths(Long classroomSubjectId);

    
    LearningNodeResponse createLearningNode(CreateLearningNodeRequest request);
    LearningNodeResponse updateLearningNode(Long nodeId, UpdateLearningNodeRequest request);
    void deleteLearningNode(Long nodeId);
    LearningNodeResponse getLearningNodeById(Long nodeId);
    List<LearningNodeResponse> getTemplateNodesByPathId(Long pathId);
    List<LearningNodeResponse> getClassroomNodesByClassroomId(Long classroomSubjectId);

    
    LearningPathGraphResponse getLearningPathGraph(Long pathId);
    ClassroomGraphResponse getClassroomGraph(Long classroomSubjectId);

    
    PublishResultResponse publishClassroomPath(Long classroomSubjectId, Long pathId);
    void unpublishClassroomPath(Long classroomSubjectId, Long pathId);
    void deleteDraftPath(Long classroomSubjectId, Long pathId);
    void backfillProgressForStudent(Long classroomSubjectId, Long studentId);

    
    int unlockOnClassNode(Long classroomSubjectId, Long nodeId);

    List<StudentInClassResponse> getNodeStudents(Long nodeId);
    void assignStudentsToNode(Long nodeId, List<Long> studentUserIds);

    LearningNodeResponse scheduleNode(Long nodeId, com.fedu.fedu.dto.req.ScheduleNodeRequest request);

    List<SubjectResponse> getLibrarySubjectsForCurrentTeacher();
}

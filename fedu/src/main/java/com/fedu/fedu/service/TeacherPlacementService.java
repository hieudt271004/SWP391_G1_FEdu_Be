package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreatePlacementQuizRequest;
import com.fedu.fedu.dto.res.PlacementQuizDetailsResponse;
import com.fedu.fedu.dto.req.ScoreBandRequest;
import com.fedu.fedu.dto.res.ScoreBandResponse;

import java.util.List;


public interface TeacherPlacementService {

    
    void setPlacementQuiz(Long classroomSubjectId, Long testId, Long teacherId);

    
    List<ScoreBandResponse> configureScoreBands(Long testId, List<ScoreBandRequest> bands, Long teacherId);

    
    List<ScoreBandResponse> getScoreBands(Long testId);

    
    PlacementQuizDetailsResponse createPlacementQuiz(Long classroomSubjectId, CreatePlacementQuizRequest request, Long teacherId);

    
    PlacementQuizDetailsResponse getPlacementQuizDetails(Long classroomSubjectId, Long teacherId);
}

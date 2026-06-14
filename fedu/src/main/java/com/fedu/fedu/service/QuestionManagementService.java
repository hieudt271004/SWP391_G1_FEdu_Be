package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.QuestionRequest;
import com.fedu.fedu.dto.res.QuestionResponse;

import java.util.List;

public interface QuestionManagementService {
    List<QuestionResponse> getQuestions(Long testId);
    
    QuestionResponse addQuestion(Long testId, QuestionRequest request);
    
    QuestionResponse updateQuestion(Long questionId, QuestionRequest request);
    
    void deleteQuestion(Long questionId);
}

package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateNodeQuestionRequest;
import com.fedu.fedu.dto.req.CreateQuestionAnswerRequest;
import com.fedu.fedu.dto.res.NodeQuestionResponse;
import com.fedu.fedu.dto.res.QuestionAnswerResponse;

import java.util.List;





public interface NodeQnaService {

    
    List<NodeQuestionResponse> getQuestionsForStudent(Long nodeId, Long studentId);

    NodeQuestionResponse askQuestion(Long nodeId, Long studentId, CreateNodeQuestionRequest request);

    NodeQuestionResponse updateQuestion(Long questionId, Long studentId, CreateNodeQuestionRequest request);

    void deleteQuestion(Long questionId, Long studentId);

    
    List<NodeQuestionResponse> getQuestionsForTeacher(Long nodeId, Long teacherId);

    QuestionAnswerResponse answerQuestion(Long questionId, Long teacherId, CreateQuestionAnswerRequest request);

    QuestionAnswerResponse updateAnswer(Long answerId, Long teacherId, CreateQuestionAnswerRequest request);

    void deleteAnswer(Long answerId, Long teacherId);
}

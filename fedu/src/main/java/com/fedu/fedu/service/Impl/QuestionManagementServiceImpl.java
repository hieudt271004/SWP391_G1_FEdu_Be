package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AnswerRequest;
import com.fedu.fedu.dto.req.QuestionRequest;
import com.fedu.fedu.dto.res.AnswerResponse;
import com.fedu.fedu.dto.res.QuestionResponse;
import com.fedu.fedu.entity.Test;
import com.fedu.fedu.entity.TestAnswer;
import com.fedu.fedu.entity.TestQuestion;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.TestAnswerRepository;
import com.fedu.fedu.repository.TestQuestionRepository;
import com.fedu.fedu.repository.TestRepository;
import com.fedu.fedu.service.QuestionManagementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuestionManagementServiceImpl implements QuestionManagementService {

    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerRepository testAnswerRepository;

    @Override
    @Transactional(readOnly = true)
    public List<QuestionResponse> getQuestions(Long testId) {
        testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        List<TestQuestion> questions = testQuestionRepository.findByTestTestId(testId);
        return questions.stream()
                .map(this::mapToQuestionResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public QuestionResponse addQuestion(Long testId, QuestionRequest request) {
        Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        TestQuestion question = TestQuestion.builder()
                .test(test)
                .questionContent(request.getQuestionContent())
                .questionType(request.getQuestionType())
                .score(request.getScore() != null ? request.getScore() : BigDecimal.ONE)
                .build();

        testQuestionRepository.save(question);

        List<TestAnswer> answers = new ArrayList<>();
        if (request.getAnswers() != null) {
            for (AnswerRequest answerReq : request.getAnswers()) {
                TestAnswer answer = TestAnswer.builder()
                        .question(question)
                        .answerContent(answerReq.getAnswerContent())
                        .isCorrect(answerReq.getIsCorrect() != null ? answerReq.getIsCorrect() : false)
                        .build();
                testAnswerRepository.save(answer);
                answers.add(answer);
            }
        }

        return mapToQuestionResponse(question, answers);
    }

    @Override
    @Transactional
    public QuestionResponse updateQuestion(Long questionId, QuestionRequest request) {
        TestQuestion question = testQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));

        question.setQuestionContent(request.getQuestionContent());
        question.setQuestionType(request.getQuestionType());
        if (request.getScore() != null) {
            question.setScore(request.getScore());
        }

        testQuestionRepository.save(question);

        // Delete old answers
        List<TestAnswer> oldAnswers = testAnswerRepository.findByQuestionQuestionId(questionId);
        testAnswerRepository.deleteAll(oldAnswers);

        // Save new answers
        List<TestAnswer> answers = new ArrayList<>();
        if (request.getAnswers() != null) {
            for (AnswerRequest answerReq : request.getAnswers()) {
                TestAnswer answer = TestAnswer.builder()
                        .question(question)
                        .answerContent(answerReq.getAnswerContent())
                        .isCorrect(answerReq.getIsCorrect() != null ? answerReq.getIsCorrect() : false)
                        .build();
                testAnswerRepository.save(answer);
                answers.add(answer);
            }
        }

        return mapToQuestionResponse(question, answers);
    }

    @Override
    @Transactional
    public void deleteQuestion(Long questionId) {
        TestQuestion question = testQuestionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question not found with id: " + questionId));
        testQuestionRepository.delete(question);
    }

    private QuestionResponse mapToQuestionResponse(TestQuestion question) {
        List<TestAnswer> answers = testAnswerRepository.findByQuestionQuestionId(question.getQuestionId());
        return mapToQuestionResponse(question, answers);
    }

    private QuestionResponse mapToQuestionResponse(TestQuestion question, List<TestAnswer> answers) {
        List<AnswerResponse> answerResponses = answers.stream()
                .map(a -> AnswerResponse.builder()
                        .answerId(a.getAnswerId())
                        .answerContent(a.getAnswerContent())
                        .isCorrect(a.getIsCorrect())
                        .build())
                .collect(Collectors.toList());

        return QuestionResponse.builder()
                .questionId(question.getQuestionId())
                .questionContent(question.getQuestionContent())
                .questionType(question.getQuestionType())
                .score(question.getScore())
                .answers(answerResponses)
                .build();
    }
}

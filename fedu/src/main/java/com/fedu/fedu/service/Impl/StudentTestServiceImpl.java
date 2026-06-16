package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.StudentTestService;
import com.fedu.fedu.utils.enums.QuestionType;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentTestServiceImpl implements StudentTestService {

    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerRepository testAnswerRepository;
    private final StudentTestAttemptRepository studentTestAttemptRepository;
    private final StudentTestResponseRepository studentTestResponseRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final NodeEdgeRepository nodeEdgeRepository;
    private final UserAccountRepository userAccountRepository;

    @Override
    @Transactional(readOnly = true)
    public StudentTestDetailsResponse getStudentTestDetails(Long testId, Long studentId) {
        com.fedu.fedu.entity.Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        verifyStudentAccess(test.getLearningNode(), studentId);

        List<TestQuestion> questions = testQuestionRepository.findByTestTestId(testId);
        List<QuestionResponse> questionResponses = questions.stream()
                .map(q -> {
                    List<TestAnswer> answers = testAnswerRepository.findByQuestionQuestionId(q.getQuestionId());
                    List<AnswerResponse> answerResponses = answers.stream()
                            .map(a -> AnswerResponse.builder()
                                    .answerId(a.getAnswerId())
                                    .answerContent(a.getAnswerContent())
                                    .isCorrect(null) // Omit correctness flags for students
                                    .build())
                            .collect(Collectors.toList());

                    return QuestionResponse.builder()
                            .questionId(q.getQuestionId())
                            .questionContent(q.getQuestionContent())
                            .questionType(q.getQuestionType())
                            .score(q.getScore())
                            .answers(answerResponses)
                            .build();
                })
                .collect(Collectors.toList());

        return StudentTestDetailsResponse.builder()
                .testId(test.getTestId())
                .title(test.getTitle())
                .description(test.getDescription())
                .durationMinutes(test.getDurationMinutes())
                .passingPercentage(test.getPassingPercentage())
                .questions(questionResponses)
                .build();
    }

    @Override
    @Transactional
    public StudentTestAttempt startTestAttempt(Long testId, Long studentId) {
        com.fedu.fedu.entity.Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        verifyStudentAccess(test.getLearningNode(), studentId);

        UserAccount student = userAccountRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        StudentTestAttempt attempt = StudentTestAttempt.builder()
                .test(test)
                .student(student)
                .startedAt(LocalDateTime.now())
                .build();

        return studentTestAttemptRepository.save(attempt);
    }

    @Override
    @Transactional
    public AttemptSubmissionResultResponse submitTestAttempt(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request) {
        com.fedu.fedu.entity.Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        StudentTestAttempt attempt = studentTestAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));

        if (attempt.getStudent().getUserId() != studentId) {
            throw new AccessDeniedException("Lượt thi này không thuộc về bạn");
        }

        List<TestQuestion> questions = testQuestionRepository.findByTestTestId(testId);
        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal maxScore = BigDecimal.ZERO;

        Map<Long, AttemptSubmissionRequest.QuestionSubmission> submissionMap = request.getSubmissions().stream()
                .collect(Collectors.toMap(
                        AttemptSubmissionRequest.QuestionSubmission::getQuestionId,
                        s -> s,
                        (s1, s2) -> s1
                ));

        for (TestQuestion question : questions) {
            maxScore = maxScore.add(question.getScore() != null ? question.getScore() : BigDecimal.ONE);
            AttemptSubmissionRequest.QuestionSubmission sub = submissionMap.get(question.getQuestionId());

            boolean isCorrect = false;
            TestAnswer selectedAnswer = null;
            List<TestAnswer> selectedAnswersList = new ArrayList<>();
            String responseText = null;

            if (sub != null) {
                List<TestAnswer> allChoices = testAnswerRepository.findByQuestionQuestionId(question.getQuestionId());
                List<TestAnswer> correctChoices = allChoices.stream()
                        .filter(TestAnswer::getIsCorrect)
                        .collect(Collectors.toList());

                if (question.getQuestionType() == QuestionType.MULTIPLE_CHOICE || question.getQuestionType() == QuestionType.TRUE_FALSE) {
                    if (sub.getSelectedAnswerIds() != null && sub.getSelectedAnswerIds().size() == 1) {
                        Long selId = sub.getSelectedAnswerIds().get(0);
                        TestAnswer chosen = allChoices.stream()
                                .filter(a -> a.getAnswerId().equals(selId))
                                .findFirst()
                                .orElse(null);

                        if (chosen != null) {
                            selectedAnswer = chosen;
                            if (chosen.getIsCorrect()) {
                                isCorrect = true;
                            }
                        }
                    }
                } else if (question.getQuestionType() == QuestionType.MULTIPLE_SELECT) {
                    if (sub.getSelectedAnswerIds() != null && !sub.getSelectedAnswerIds().isEmpty()) {
                        Set<Long> selIds = new HashSet<>(sub.getSelectedAnswerIds());
                        selectedAnswersList = allChoices.stream()
                                .filter(a -> selIds.contains(a.getAnswerId()))
                                .collect(Collectors.toList());

                        Set<Long> correctIds = correctChoices.stream()
                                .map(TestAnswer::getAnswerId)
                                .collect(Collectors.toSet());

                        isCorrect = selIds.equals(correctIds);
                    }
                } else if (question.getQuestionType() == QuestionType.SHORT_ANSWER) {
                    responseText = sub.getResponseText();
                    if (responseText != null && !responseText.trim().isEmpty()) {
                        String cleanResponse = responseText.trim().toLowerCase();
                        isCorrect = correctChoices.stream()
                                .anyMatch(a -> a.getAnswerContent().trim().toLowerCase().equals(cleanResponse));
                    }
                } else if (question.getQuestionType() == QuestionType.ESSAY) {
                    responseText = sub.getResponseText();
                    isCorrect = true; // Mark essays as auto-correct/pass for flow continuation
                }
            }

            if (isCorrect) {
                totalScore = totalScore.add(question.getScore() != null ? question.getScore() : BigDecimal.ONE);
            }

            StudentTestResponse testResponse = StudentTestResponse.builder()
                    .studentTestAttempt(attempt)
                    .testQuestion(question)
                    .selectedAnswer(selectedAnswer)
                    .responseText(responseText)
                    .isCorrect(isCorrect)
                    .build();

            studentTestResponseRepository.save(testResponse);

            if (!selectedAnswersList.isEmpty()) {
                testResponse.setSelectedAnswers(selectedAnswersList);
                studentTestResponseRepository.save(testResponse);
            }
        }

        BigDecimal finalPercentage = BigDecimal.ZERO;
        if (maxScore.compareTo(BigDecimal.ZERO) > 0) {
            finalPercentage = totalScore.multiply(BigDecimal.valueOf(100)).divide(maxScore, 2, RoundingMode.HALF_UP);
        }

        attempt.setScore(finalPercentage);
        attempt.setSubmittedAt(LocalDateTime.now());
        studentTestAttemptRepository.save(attempt);

        boolean passed = finalPercentage.compareTo(test.getPassingPercentage()) >= 0;

        if (passed) {
            // Process node progress completion
            processNodeUnlock(studentId, test.getLearningNode(), test.getLearningNode().getLearningPath().getPathId());
        }

        return AttemptSubmissionResultResponse.builder()
                .attemptId(attempt.getAttemptId())
                .score(finalPercentage)
                .passed(passed)
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .passingPercentage(test.getPassingPercentage())
                .build();
    }

    private void verifyStudentAccess(LearningNode node, Long studentId) {
        Long csId = node.getLearningPath().getClassroomSubject().getId();
        boolean isEnrolled = classroomSubjectStudentRepository
                .existsByClassroomSubject_IdAndStudent_UserId(csId, studentId);
        if (!isEnrolled) {
            throw new AccessDeniedException("Học sinh không thuộc lớp-môn này");
        }

        StudentNodeProgress progress = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, node.getLearningPath().getPathId())
                .stream()
                .filter(p -> p.getLearningNode().getNodeId().equals(node.getNodeId()))
                .findFirst()
                .orElse(null);

        if (progress == null || progress.getStatus() == StudentProgressStatus.LOCKED) {
            throw new AccessDeniedException("Bài học này hiện đang bị khóa");
        }
    }

    private void processNodeUnlock(Long studentId, LearningNode node, Long pathId) {
        StudentNodeProgress currentProgress = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, pathId)
                .stream()
                .filter(p -> p.getLearningNode().getNodeId().equals(node.getNodeId()))
                .findFirst()
                .orElse(null);

        if (currentProgress == null || currentProgress.getStatus() == StudentProgressStatus.COMPLETED) {
            return;
        }

        // Verify all required tests in this node have at least one passed attempt
        List<com.fedu.fedu.entity.Test> nodeTests = testRepository.findByLearningNodeNodeIdAndIsDeletedFalse(node.getNodeId());
        boolean allTestsPassed = true;
        for (com.fedu.fedu.entity.Test t : nodeTests) {
            List<StudentTestAttempt> attempts = studentTestAttemptRepository.findByStudentUserIdAndTestTestId(studentId, t.getTestId());
            boolean passedTest = attempts.stream()
                    .anyMatch(att -> att.getScore() != null && att.getScore().compareTo(t.getPassingPercentage()) >= 0);
            if (!passedTest) {
                allTestsPassed = false;
                break;
            }
        }

        if (!allTestsPassed) {
            return;
        }

        // Mark current node as COMPLETED
        currentProgress.setStatus(StudentProgressStatus.COMPLETED);
        currentProgress.setCompletedAt(LocalDateTime.now());
        studentNodeProgressRepository.save(currentProgress);

        // Find next nodes via outgoing edges
        List<NodeEdge> outgoingEdges = nodeEdgeRepository.findByFromNodeNodeId(node.getNodeId());
        for (NodeEdge edge : outgoingEdges) {
            LearningNode targetNode = edge.getToNode();

            // Check if all incoming node prerequisites are COMPLETED
            boolean prerequisitesMet = checkIncomingPrerequisites(studentId, targetNode, pathId);
            if (prerequisitesMet) {
                StudentNodeProgress targetProgress = studentNodeProgressRepository
                        .findByStudentUserIdAndLearningPathPathId(studentId, pathId)
                        .stream()
                        .filter(p -> p.getLearningNode().getNodeId().equals(targetNode.getNodeId()))
                        .findFirst()
                        .orElse(null);

                if (targetProgress != null && targetProgress.getStatus() == StudentProgressStatus.LOCKED) {
                    targetProgress.setStatus(StudentProgressStatus.OPEN);
                    targetProgress.setUnlockedAt(LocalDateTime.now());
                    studentNodeProgressRepository.save(targetProgress);
                }
            }
        }
    }

    private boolean checkIncomingPrerequisites(Long studentId, LearningNode targetNode, Long pathId) {
        List<NodeEdge> incomingEdges = nodeEdgeRepository.findByToNodeNodeId(targetNode.getNodeId());
        List<StudentNodeProgress> progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, pathId);
        Map<Long, StudentProgressStatus> progressMap = progressList.stream()
                .collect(Collectors.toMap(
                        p -> p.getLearningNode().getNodeId(),
                        StudentNodeProgress::getStatus
                ));

        for (NodeEdge edge : incomingEdges) {
            StudentProgressStatus status = progressMap.get(edge.getFromNode().getNodeId());
            if (status != StudentProgressStatus.COMPLETED) {
                return false;
            }
        }
        return true;
    }
}

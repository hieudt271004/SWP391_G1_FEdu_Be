package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.req.GradeEssayRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.service.StudentTestService;
import com.fedu.fedu.utils.NodeRoutingUtils;
import com.fedu.fedu.utils.enums.NodeStatus;
import com.fedu.fedu.utils.enums.NodeTestKind;
import com.fedu.fedu.utils.enums.NodeType;
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
    private final LearningNodeRepository learningNodeRepository;
    private final UserAccountRepository userAccountRepository;
    private final com.fedu.fedu.service.LevelRoutingService levelRoutingService;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final StudentLevelHistoryRepository studentLevelHistoryRepository;
    private final com.fedu.fedu.service.LearningPathService learningPathService;

    @Override
    @Transactional(readOnly = true)
    public StudentTestDetailsResponse getStudentTestDetails(Long testId, Long studentId) {
        com.fedu.fedu.entity.Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        rejectPopQuiz(test);
        verifyStudentAccess(test.getLearningNode(), studentId);
        assertTestReleased(test);

        List<TestQuestion> questions = testQuestionRepository.findByTestTestId(testId);
        List<QuestionResponse> questionResponses = questions.stream()
                .map(q -> {
                    List<TestAnswer> answers = testAnswerRepository.findByQuestionQuestionId(q.getQuestionId());
                    List<AnswerResponse> answerResponses = answers.stream()
                            .map(a -> AnswerResponse.builder()
                                    .answerId(a.getAnswerId())
                                    .answerContent(a.getAnswerContent())
                                    .isCorrect(null) 
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
                .releaseEndsAt(test.getReleaseEndsAt())
                .questions(questionResponses)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public StudentTestDetailsResponse getTestDetailsForPlacement(Long testId) {
        
        
        com.fedu.fedu.entity.Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        List<TestQuestion> questions = testQuestionRepository.findByTestTestId(testId);
        List<QuestionResponse> questionResponses = questions.stream()
                .map(q -> {
                    List<TestAnswer> answers = testAnswerRepository.findByQuestionQuestionId(q.getQuestionId());
                    List<AnswerResponse> answerResponses = answers.stream()
                            .map(a -> AnswerResponse.builder()
                                    .answerId(a.getAnswerId())
                                    .answerContent(a.getAnswerContent())
                                    .isCorrect(null) 
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

        rejectPopQuiz(test);
        verifyStudentAccess(test.getLearningNode(), studentId);
        assertTestReleased(test);
        assertWithinReleaseWindow(test, 0);
        assertNoPendingReview(testId, studentId);

        UserAccount student = userAccountRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        StudentTestAttempt attempt = StudentTestAttempt.builder()
                .test(test)
                .student(student)
                .startedAt(LocalDateTime.now())
                .status(com.fedu.fedu.utils.enums.AttemptStatus.IN_PROGRESS)
                .build();

        return studentTestAttemptRepository.save(attempt);
    }

    @Override
    @Transactional
    public StudentTestAttempt startTestAttemptForPlacement(Long testId, Long studentId) {
        
        
        com.fedu.fedu.entity.Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        UserAccount student = userAccountRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        StudentTestAttempt attempt = StudentTestAttempt.builder()
                .test(test)
                .student(student)
                .startedAt(LocalDateTime.now())
                .status(com.fedu.fedu.utils.enums.AttemptStatus.IN_PROGRESS)
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

        if (test.getLearningNode() == null) {
            throw new com.fedu.fedu.exception.InvalidDataException(
                    "Bài test phân loại: hãy dùng endpoint nộp bài phân loại (placement).");
        }


        if (test.getLearningNode().getTestKind() == NodeTestKind.PLACEMENT && isEntryPlacementTest(test)) {
            throw new com.fedu.fedu.exception.InvalidDataException(
                    "Bài test năng lực đầu vào: hãy nộp qua luồng phân loại (placement).");
        }

        
        assertWithinReleaseWindow(test, 30);

        BigDecimal finalPercentage = gradeAttempt(test, attempt, request);

        if (finalPercentage == null) {
            
            return AttemptSubmissionResultResponse.builder()
                    .attemptId(attempt.getAttemptId())
                    .pendingManualGrading(true)
                    .startedAt(attempt.getStartedAt())
                    .submittedAt(attempt.getSubmittedAt())
                    .passingPercentage(test.getPassingPercentage())
                    .build();
        }

        boolean passed = test.getPassingPercentage() != null
                && finalPercentage.compareTo(test.getPassingPercentage()) >= 0;

        LearningNode node = test.getLearningNode();
        ClassroomSubject cs = node.getLearningPath().getClassroomSubject();
        
        Integer levelBefore = currentLevelOf(cs, studentId);
        routeByTestKind(studentId, node, finalPercentage, passed);
        Integer levelAfter = currentLevelOf(cs, studentId);

        return AttemptSubmissionResultResponse.builder()
                .attemptId(attempt.getAttemptId())
                .score(finalPercentage)
                .passed(passed)
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .passingPercentage(test.getPassingPercentage())
                .newLevel(levelAfter != null && !levelAfter.equals(levelBefore) ? levelAfter : null)
                .build();
    }

    
    private void routeByTestKind(Long studentId, LearningNode node, BigDecimal percentage, boolean passed) {
        Long pathId = node.getLearningPath().getPathId();
        if (node.getTestKind() == NodeTestKind.PLACEMENT) {

            routePlacementRetakeNode(studentId, node, pathId, percentage);
        } else if (node.getTestKind() == NodeTestKind.GATE) {

            routeGateNode(studentId, node, pathId, percentage);
        } else if (node.getTestKind() == NodeTestKind.FREE_CHOICE) {

            routeFreeChoiceNode(studentId, node, pathId, passed);
        } else {

            routeAfterAttempt(studentId, node, pathId, passed);
        }
    }


    private boolean isEntryPlacementTest(com.fedu.fedu.entity.Test test) {
        return classroomSubjectRepository.findByQuizStartTestId(test.getTestId()).isPresent();
    }

    
    private Integer currentLevelOf(ClassroomSubject cs, Long studentId) {
        if (cs == null) return null;
        return classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(cs.getId(), studentId)
                .map(css -> css.getCurrentLevel())
                .orElse(null);
    }

    @Override
    @Transactional
    public BigDecimal submitForGrading(Long testId, Long attemptId, Long studentId, AttemptSubmissionRequest request) {
        com.fedu.fedu.entity.Test test = testRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));
        StudentTestAttempt attempt = studentTestAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));
        if (attempt.getStudent().getUserId() != studentId) {
            throw new AccessDeniedException("Lượt thi này không thuộc về bạn");
        }
        return gradeAttempt(test, attempt, request);
    }

    
    private void assertTestReleased(com.fedu.fedu.entity.Test test) {
        if (test.getLearningNode() != null && test.getReleasedAt() == null) {
            throw new com.fedu.fedu.exception.InvalidDataException(
                    "Đề chưa được phát. Vui lòng chờ giáo viên phát đề.");
        }
    }

    
    private void assertWithinReleaseWindow(com.fedu.fedu.entity.Test test, long graceSeconds) {
        if (test.getReleaseEndsAt() != null
                && LocalDateTime.now().isAfter(test.getReleaseEndsAt().plusSeconds(graceSeconds))) {
            throw new com.fedu.fedu.exception.InvalidDataException("Đã hết giờ làm bài của đề này.");
        }
    }

    
    private void assertNoPendingReview(Long testId, Long studentId) {
        boolean pending = studentTestAttemptRepository
                .findByStudentUserIdAndTestTestId(studentId, testId)
                .stream()
                .anyMatch(a -> a.getStatus() == com.fedu.fedu.utils.enums.AttemptStatus.PENDING_REVIEW);
        if (pending) {
            throw new com.fedu.fedu.exception.InvalidDataException(
                    "Bài làm trước của bạn đang chờ giáo viên chấm câu tự luận — chưa thể làm lại.");
        }
    }

    

    @Override
    @Transactional(readOnly = true)
    public AttemptGradingDetailResponse getAttemptForGrading(Long attemptId) {
        StudentTestAttempt attempt = studentTestAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));
        return buildGradingDetail(attempt,
                studentTestResponseRepository.findByStudentTestAttemptAttemptId(attemptId));
    }

    @Override
    @Transactional
    public AttemptGradingDetailResponse gradeEssayAttempt(Long attemptId, GradeEssayRequest request) {
        StudentTestAttempt attempt = studentTestAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));
        if (attempt.getStatus() != com.fedu.fedu.utils.enums.AttemptStatus.PENDING_REVIEW) {
            throw new com.fedu.fedu.exception.InvalidDataException(
                    "Lượt thi này không ở trạng thái chờ chấm tự luận.");
        }

        List<StudentTestResponse> responses =
                studentTestResponseRepository.findByStudentTestAttemptAttemptId(attemptId);
        Map<Long, StudentTestResponse> byId = responses.stream()
                .collect(Collectors.toMap(StudentTestResponse::getResponseId, r -> r, (a, b) -> a));

        for (GradeEssayRequest.EssayGrade g : request.getGrades()) {
            StudentTestResponse r = byId.get(g.getResponseId());
            if (r == null) {
                throw new com.fedu.fedu.exception.InvalidDataException(
                        "Câu trả lời " + g.getResponseId() + " không thuộc lượt thi này.");
            }
            if (r.getTestQuestion().getQuestionType() != QuestionType.ESSAY) {
                throw new com.fedu.fedu.exception.InvalidDataException(
                        "Chỉ chấm tay được câu tự luận.");
            }
            r.setIsCorrect(g.getIsCorrect());
            studentTestResponseRepository.save(r);
        }

        boolean stillPending = responses.stream()
                .anyMatch(r -> r.getTestQuestion().getQuestionType() == QuestionType.ESSAY
                        && r.getIsCorrect() == null);
        if (!stillPending) {
            finalizeGradedAttempt(attempt, responses);
        }
        return buildGradingDetail(attempt, responses);
    }

    
    private void finalizeGradedAttempt(StudentTestAttempt attempt, List<StudentTestResponse> responses) {
        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal maxScore = BigDecimal.ZERO;
        for (StudentTestResponse r : responses) {
            BigDecimal qScore = r.getTestQuestion().getScore() != null
                    ? r.getTestQuestion().getScore() : BigDecimal.ONE;
            maxScore = maxScore.add(qScore);
            if (Boolean.TRUE.equals(r.getIsCorrect())) {
                totalScore = totalScore.add(qScore);
            }
        }
        BigDecimal pct = BigDecimal.ZERO;
        if (maxScore.compareTo(BigDecimal.ZERO) > 0) {
            pct = totalScore.multiply(BigDecimal.valueOf(100)).divide(maxScore, 2, RoundingMode.HALF_UP);
        }
        attempt.setScore(pct);
        attempt.setStatus(com.fedu.fedu.utils.enums.AttemptStatus.SUBMITTED);
        studentTestAttemptRepository.save(attempt);

        com.fedu.fedu.entity.Test test = attempt.getTest();
        Long studentId = attempt.getStudent().getUserId();
        LearningNode node = test.getLearningNode();


        if (node == null || (node.getTestKind() == NodeTestKind.PLACEMENT && isEntryPlacementTest(test))) {
            finalizePlacementAfterGrading(test, studentId, pct);
            return;
        }
        boolean passed = test.getPassingPercentage() != null
                && pct.compareTo(test.getPassingPercentage()) >= 0;
        routeByTestKind(studentId, node, pct, passed);
    }

    
    private void finalizePlacementAfterGrading(com.fedu.fedu.entity.Test test, Long studentId, BigDecimal pct) {
        ClassroomSubject cs = classroomSubjectRepository.findByQuizStartTestId(test.getTestId())
                .orElse(null);
        if (cs == null && test.getLearningNode() != null) {
            cs = test.getLearningNode().getLearningPath().getClassroomSubject();
        }
        if (cs == null) {
            log.warn("Không tìm thấy lớp-môn cho placement test {} — bỏ qua gán mức.", test.getTestId());
            return;
        }
        ClassroomSubjectStudent css = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(cs.getId(), studentId)
                .orElse(null);
        if (css == null) {
            log.warn("Học sinh {} không thuộc lớp-môn {} — bỏ qua gán mức.", studentId, cs.getId());
            return;
        }
        if (css.getCurrentLevel() != null) {
            return; 
        }

        Integer level = levelRoutingService.resolveLevel(test.getTestId(), pct);
        if (level == null) {
            log.warn("Điểm placement {} ngoài mọi band của test {} — mặc định mức {}.",
                    pct, test.getTestId(), com.fedu.fedu.utils.LearningLevels.WEAK);
            level = com.fedu.fedu.utils.LearningLevels.WEAK;
        }
        boolean isRetake = !studentLevelHistoryRepository
                .findByStudentUserIdAndClassroomSubjectIdOrderByChangedAtAsc(studentId, cs.getId())
                .isEmpty();
        levelRoutingService.assignInitialLevel(cs.getId(), studentId, level,
                isRetake ? com.fedu.fedu.utils.enums.LevelChangeReason.RETAKE
                        : com.fedu.fedu.utils.enums.LevelChangeReason.PLACEMENT);
        learningPathService.backfillProgressForStudent(cs.getId(), studentId);
    }

    
    private AttemptGradingDetailResponse buildGradingDetail(StudentTestAttempt attempt,
                                                            List<StudentTestResponse> responses) {
        String studentName = "";
        if (attempt.getStudent() != null) {
            String firstName = attempt.getStudent().getFirstName() != null ? attempt.getStudent().getFirstName() : "";
            String lastName = attempt.getStudent().getLastName() != null ? attempt.getStudent().getLastName() : "";
            studentName = (firstName + " " + lastName).trim();
        }

        List<AttemptGradingDetailResponse.ResponseGradingItem> items = responses.stream()
                .map(r -> {
                    TestQuestion q = r.getTestQuestion();
                    List<String> selected = new ArrayList<>();
                    if (r.getSelectedAnswer() != null) {
                        selected.add(r.getSelectedAnswer().getAnswerContent());
                    }
                    if (r.getSelectedAnswers() != null) {
                        r.getSelectedAnswers().forEach(a -> selected.add(a.getAnswerContent()));
                    }
                    return AttemptGradingDetailResponse.ResponseGradingItem.builder()
                            .responseId(r.getResponseId())
                            .questionId(q.getQuestionId())
                            .questionContent(q.getQuestionContent())
                            .questionType(q.getQuestionType())
                            .maxScore(q.getScore() != null ? q.getScore() : BigDecimal.ONE)
                            .responseText(r.getResponseText())
                            .selectedAnswers(selected)
                            .isCorrect(r.getIsCorrect())
                            .build();
                })
                .collect(Collectors.toList());

        return AttemptGradingDetailResponse.builder()
                .attemptId(attempt.getAttemptId())
                .testId(attempt.getTest().getTestId())
                .testTitle(attempt.getTest().getTitle())
                .studentId(attempt.getStudent() != null ? attempt.getStudent().getUserId() : null)
                .studentName(studentName)
                .status(attempt.getStatus() != null ? attempt.getStatus().name() : null)
                .score(attempt.getScore())
                .submittedAt(attempt.getSubmittedAt())
                .responses(items)
                .build();
    }

    




    BigDecimal gradeAttempt(com.fedu.fedu.entity.Test test, StudentTestAttempt attempt, AttemptSubmissionRequest request) {
        List<TestQuestion> questions = testQuestionRepository.findByTestTestId(test.getTestId());
        BigDecimal totalScore = BigDecimal.ZERO;
        BigDecimal maxScore = BigDecimal.ZERO;
        boolean hasEssay = false;

        Map<Long, AttemptSubmissionRequest.QuestionSubmission> submissionMap = request.getSubmissions().stream()
                .collect(Collectors.toMap(
                        AttemptSubmissionRequest.QuestionSubmission::getQuestionId,
                        s -> s,
                        (s1, s2) -> s1
                ));

        for (TestQuestion question : questions) {
            maxScore = maxScore.add(question.getScore() != null ? question.getScore() : BigDecimal.ONE);
            AttemptSubmissionRequest.QuestionSubmission sub = submissionMap.get(question.getQuestionId());

            Boolean isCorrect = false;
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
                }
            }

            if (question.getQuestionType() == QuestionType.ESSAY) {
                
                isCorrect = null;
                hasEssay = true;
            }

            if (Boolean.TRUE.equals(isCorrect)) {
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

        attempt.setSubmittedAt(LocalDateTime.now());

        if (hasEssay) {
            
            attempt.setScore(null);
            attempt.setStatus(com.fedu.fedu.utils.enums.AttemptStatus.PENDING_REVIEW);
            studentTestAttemptRepository.save(attempt);
            return null;
        }

        BigDecimal finalPercentage = BigDecimal.ZERO;
        if (maxScore.compareTo(BigDecimal.ZERO) > 0) {
            finalPercentage = totalScore.multiply(BigDecimal.valueOf(100)).divide(maxScore, 2, RoundingMode.HALF_UP);
        }

        attempt.setScore(finalPercentage);
        attempt.setStatus(com.fedu.fedu.utils.enums.AttemptStatus.SUBMITTED);
        studentTestAttemptRepository.save(attempt);

        return finalPercentage;
    }

    





    private void rejectPopQuiz(com.fedu.fedu.entity.Test test) {
        if (test.getTestKind() == com.fedu.fedu.utils.enums.TestKind.POP_QUIZ) {
            throw new AccessDeniedException("Bài kiểm tra này chỉ truy cập được qua tính năng giao bài pop-quiz");
        }
    }

    private void verifyStudentAccess(LearningNode node, Long studentId) {
        
        if (node == null) {
            return;
        }
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

    

    private StudentNodeProgress getProgress(Long studentId, Long pathId, Long nodeId) {
        return studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, pathId)
                .stream()
                .filter(p -> p.getLearningNode().getNodeId().equals(nodeId))
                .findFirst()
                .orElse(null);
    }

    
    private boolean allNodeTestsPassed(Long studentId, LearningNode node) {
        List<com.fedu.fedu.entity.Test> nodeTests =
                testRepository.findByLearningNodeNodeIdAndIsDeletedFalse(node.getNodeId());
        for (com.fedu.fedu.entity.Test t : nodeTests) {
            List<StudentTestAttempt> attempts =
                    studentTestAttemptRepository.findByStudentUserIdAndTestTestId(studentId, t.getTestId());
            boolean passedTest = attempts.stream()
                    .anyMatch(att -> att.getScore() != null
                            && att.getScore().compareTo(t.getPassingPercentage()) >= 0);
            if (!passedTest) return false;
        }
        return true;
    }

    
    
    private void markCompleted(StudentNodeProgress progress, LearningNode node) {
        LocalDateTime now = LocalDateTime.now();
        progress.setStatus(StudentProgressStatus.COMPLETED);
        progress.setCompletedAt(now);
        if (node.getDeadlineAt() != null && now.isAfter(node.getDeadlineAt())) {
            progress.setCompletedLate(true);
        }
    }

    
    private void openNode(Long studentId, LearningNode target, Long pathId) {
        StudentNodeProgress tp = getProgress(studentId, pathId, target.getNodeId());
        if (tp != null && tp.getStatus() == StudentProgressStatus.LOCKED) {
            tp.setStatus(StudentProgressStatus.OPEN);
            tp.setUnlockedAt(LocalDateTime.now());
            studentNodeProgressRepository.save(tp);
        }
    }

    
    private void openMainTargetIfEligible(Long studentId, LearningNode target, Long pathId) {


        if (target.getNodeType() == NodeType.ON_CLASS) {
            if (target.getStatus() == NodeStatus.OPEN
                    && (target.getLevel() == null || matchesStudentLevel(studentId, target))
                    && checkIncomingPrerequisites(studentId, target, pathId)) {
                openNode(studentId, target, pathId);
            }
            for (NodeEdge next : nodeEdgeRepository.findByFromNodeNodeId(target.getNodeId())) {
                openMainTargetIfEligible(studentId, next.getToNode(), pathId);
            }
            return;
        }

        if (target.getLevel() != null
                && target.getTestKind() != NodeTestKind.FREE_CHOICE
                && !matchesStudentLevel(studentId, target)) return;
        if (!checkIncomingPrerequisites(studentId, target, pathId)) return;
        openNode(studentId, target, pathId);
    }

    private boolean matchesStudentLevel(Long studentId, LearningNode node) {
        if (node.getLevel() == null) return true;
        ClassroomSubject cs = node.getLearningPath().getClassroomSubject();
        if (cs == null) return true;
        return classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(cs.getId(), studentId)
                .map(css -> node.getLevel().equals(css.getCurrentLevel()))
                .orElse(false);
    }

    private void routeAfterAttempt(Long studentId, LearningNode node, Long pathId, boolean passed) {
        routeMainNode(studentId, node, pathId, passed);
    }
    
    void routePlacementRetakeNode(Long studentId, LearningNode placementNode, Long pathId, BigDecimal percentage) {
        StudentNodeProgress gp = getProgress(studentId, pathId, placementNode.getNodeId());
        if (gp != null) {
            if (gp.getStatus() != StudentProgressStatus.COMPLETED) {
                markCompleted(gp, placementNode);
            }
            studentNodeProgressRepository.save(gp);
        }

        ClassroomSubject cs = placementNode.getLearningPath().getClassroomSubject();
        if (cs != null) {
            Long testId = testRepository.findByLearningNodeNodeIdAndIsDeletedFalse(placementNode.getNodeId())
                    .stream()
                    .findFirst()
                    .map(com.fedu.fedu.entity.Test::getTestId)
                    .orElse(null);
            levelRoutingService.applyPlacementRetakeRouting(cs.getId(), placementNode, studentId, testId, percentage);
        }

        for (NodeEdge edge : nodeEdgeRepository.findByFromNodeNodeId(placementNode.getNodeId())) {
            openMainTargetIfEligible(studentId, edge.getToNode(), pathId);
        }
    }

    void routeGateNode(Long studentId, LearningNode gateNode, Long pathId, BigDecimal percentage) {
        StudentNodeProgress gp = getProgress(studentId, pathId, gateNode.getNodeId());
        if (gp != null) {
            if (gp.getStatus() != StudentProgressStatus.COMPLETED) {
                markCompleted(gp, gateNode);
            }
            studentNodeProgressRepository.save(gp);
        }

        ClassroomSubject cs = gateNode.getLearningPath().getClassroomSubject();
        if (cs != null) {
            levelRoutingService.applyGateRouting(cs.getId(), gateNode, studentId, percentage);
        }

        for (NodeEdge edge : nodeEdgeRepository.findByFromNodeNodeId(gateNode.getNodeId())) {
            openMainTargetIfEligible(studentId, edge.getToNode(), pathId);
        }
    }

    void routeFreeChoiceNode(Long studentId, LearningNode fcNode, Long pathId, boolean passed) {
        if (!passed && !isDowngradeChoice(studentId, fcNode)) {
            return;
        }
        
        StudentNodeProgress gp = getProgress(studentId, pathId, fcNode.getNodeId());
        if (gp != null) {
            if (gp.getStatus() != StudentProgressStatus.COMPLETED) {
                markCompleted(gp, fcNode);
            }
            studentNodeProgressRepository.save(gp);
        }
        
        List<StudentNodeProgress> all = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, pathId);
        for (StudentNodeProgress p : all) {
            LearningNode n = p.getLearningNode();
            if (!n.getNodeId().equals(fcNode.getNodeId())
                    && n.getTestKind() == NodeTestKind.FREE_CHOICE
                    && Objects.equals(n.getStageOrder(), fcNode.getStageOrder())
                    && p.getStatus() != StudentProgressStatus.COMPLETED) {
                p.setStatus(StudentProgressStatus.LOCKED);
            }
        }
        studentNodeProgressRepository.saveAll(all);
        
        ClassroomSubject cs = fcNode.getLearningPath().getClassroomSubject();
        if (cs != null) {
            levelRoutingService.applyFreeChoiceRouting(cs.getId(), fcNode, studentId);
        }
        
        for (NodeEdge edge : nodeEdgeRepository.findByFromNodeNodeId(fcNode.getNodeId())) {
            openMainTargetIfEligible(studentId, edge.getToNode(), pathId);
        }
    }

    
    private boolean isDowngradeChoice(Long studentId, LearningNode fcNode) {
        Integer target = fcNode.getLevel();
        ClassroomSubject cs = fcNode.getLearningPath() != null
                ? fcNode.getLearningPath().getClassroomSubject() : null;
        if (target == null || cs == null) {
            return false;
        }
        Integer current = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(cs.getId(), studentId)
                .map(css -> css.getCurrentLevel())
                .orElse(null);
        return current != null && target < current;
    }

    @Override
    @Transactional
    public void completeNode(Long nodeId, Long studentId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));
        verifyStudentAccess(node, studentId);

        
        if (node.getTestKind() != null && node.getTestKind() != NodeTestKind.NONE) {
            throw new com.fedu.fedu.exception.InvalidDataException(
                    "Node kiểm tra được hoàn thành thông qua việc nộp bài test.");
        }
        
        if (!allNodeTestsPassed(studentId, node)) {
            throw new com.fedu.fedu.exception.InvalidDataException(
                    "Bài học này có bài kiểm tra — bạn cần đạt bài kiểm tra để hoàn thành.");
        }
        
        routeMainNode(studentId, node, node.getLearningPath().getPathId(), true);
    }

    private void routeMainNode(Long studentId, LearningNode node, Long pathId, boolean passed) {
        StudentNodeProgress current = getProgress(studentId, pathId, node.getNodeId());
        if (current == null) return;

        if (passed) {
            if (current.getStatus() != StudentProgressStatus.COMPLETED) {
                if (!allNodeTestsPassed(studentId, node)) return;
                markCompleted(current, node);
                studentNodeProgressRepository.save(current);
            }
            for (NodeEdge edge : nodeEdgeRepository.findByFromNodeNodeId(node.getNodeId())) {
                openMainTargetIfEligible(studentId, edge.getToNode(), pathId);
            }
        }
        
    }

    private boolean checkIncomingPrerequisites(Long studentId, LearningNode targetNode, Long pathId) {
        Integer studentLevel = null;
        if (targetNode.getLearningPath() != null && targetNode.getLearningPath().getClassroomSubject() != null) {
            Long csId = targetNode.getLearningPath().getClassroomSubject().getId();
            studentLevel = classroomSubjectStudentRepository
                    .findByClassroomSubject_IdAndStudent_UserId(csId, studentId)
                    .map(ClassroomSubjectStudent::getCurrentLevel)
                    .orElse(null);
        }

        List<StudentNodeProgress> progressList = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(studentId, pathId);
        Map<Long, StudentProgressStatus> progressMap = progressList.stream()
                .collect(Collectors.toMap(
                        p -> p.getLearningNode().getNodeId(),
                        StudentNodeProgress::getStatus,
                        (a, b) -> a
                ));


        return NodeRoutingUtils.prereqMetThroughOnClass(
                targetNode.getNodeId(), nodeEdgeRepository::findByToNodeNodeId, progressMap, studentLevel);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentTestAttemptHistoryResponse> getStudentTestAttemptHistory(Long studentId) {
        List<StudentTestAttempt> attempts = studentTestAttemptRepository.findByStudentUserIdOrderBySubmittedAtDesc(studentId);

        return attempts.stream()
                .filter(a -> a.getTest().getTestKind() != com.fedu.fedu.utils.enums.TestKind.POP_QUIZ)
                .map(a -> {
            com.fedu.fedu.entity.Test t = a.getTest();
            String csName = "N/A";
            
            if (t.getLearningNode() != null) {
                LearningPath path = t.getLearningNode().getLearningPath();
                if (path != null && path.getClassroomSubject() != null) {
                    ClassroomSubject cs = path.getClassroomSubject();
                    csName = cs.getClassroom().getClassName() + " - " + cs.getSubject().getSubjectName();
                }
            } else {
                Optional<ClassroomSubject> csOpt = classroomSubjectRepository.findByQuizStartTestId(t.getTestId());
                if (csOpt.isPresent()) {
                    ClassroomSubject cs = csOpt.get();
                    csName = cs.getClassroom().getClassName() + " - " + cs.getSubject().getSubjectName();
                }
            }
            
            return StudentTestAttemptHistoryResponse.builder()
                    .attemptId(a.getAttemptId())
                    .testId(t.getTestId())
                    .classroomSubjectName(csName)
                    .testTitle(t.getTitle())
                    .testDescription(t.getDescription())
                    .score(a.getScore())
                    .submittedAt(a.getSubmittedAt())
                    .tabOutCount(a.getTabOutCount())
                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public int recordTabOut(Long testId, Long attemptId, Long studentId) {
        StudentTestAttempt attempt = studentTestAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));
        if (attempt.getStudent().getUserId() != studentId) {
            throw new AccessDeniedException("Lượt thi này không thuộc về bạn");
        }
        
        if (attempt.getStatus() != com.fedu.fedu.utils.enums.AttemptStatus.IN_PROGRESS) {
            return attempt.getTabOutCount() == null ? 0 : attempt.getTabOutCount();
        }
        int next = (attempt.getTabOutCount() == null ? 0 : attempt.getTabOutCount()) + 1;
        attempt.setTabOutCount(next);
        studentTestAttemptRepository.save(attempt);
        log.info("Student {} tab-out #{} on attempt {}", studentId, next, attemptId);
        return next;
    }
}

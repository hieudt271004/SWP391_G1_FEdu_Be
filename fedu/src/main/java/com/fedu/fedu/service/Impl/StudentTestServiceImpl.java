package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.service.StudentTestService;
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
    private final UserAccountRepository userAccountRepository;
    private final com.fedu.fedu.service.LevelRoutingService levelRoutingService;
    private final ClassroomSubjectRepository classroomSubjectRepository;

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

        BigDecimal finalPercentage = gradeAttempt(test, attempt, request);
        boolean passed = finalPercentage.compareTo(test.getPassingPercentage()) >= 0;

        LearningNode node = test.getLearningNode();
        Long pathId = node.getLearningPath().getPathId();
        if (node.getTestKind() == NodeTestKind.GATE) {
            // Cổng phân luồng: định tuyến theo điểm (đổi mức + mở nhánh đúng mức), không pass/fail.
            routeGateNode(studentId, node, pathId, finalPercentage);
        } else if (node.getTestKind() == NodeTestKind.FREE_CHOICE) {
            // Test tự do chọn: đạt bài này → học theo nhánh của node (node.level).
            routeFreeChoiceNode(studentId, node, pathId, passed);
        } else {
            // Node học thường: đậu đi tiếp / trượt rẽ nhánh phụ + khóa test node hiện tại.
            routeAfterAttempt(studentId, node, pathId, passed);
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

    BigDecimal gradeAttempt(com.fedu.fedu.entity.Test test, StudentTestAttempt attempt, AttemptSubmissionRequest request) {
        List<TestQuestion> questions = testQuestionRepository.findByTestTestId(test.getTestId());
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
        attempt.setStatus(com.fedu.fedu.utils.enums.AttemptStatus.SUBMITTED);
        studentTestAttemptRepository.save(attempt);

        return finalPercentage;
    }

    private void verifyStudentAccess(LearningNode node, Long studentId) {
        // Bài test phân loại (placement) không gắn node — kiểm soát truy cập ở PlacementService.
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

    // Định tuyến tiến độ sau mỗi lần nộp test.

    private StudentNodeProgress getProgress(Long studentId, Long pathId, Long nodeId) {
        return studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, pathId)
                .stream()
                .filter(p -> p.getLearningNode().getNodeId().equals(nodeId))
                .findFirst()
                .orElse(null);
    }

    // Mọi test bắt buộc của node đã có ít nhất 1 lượt đạt?
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

    // Mở 1 node nếu đang LOCKED (không xét điều kiện tiên quyết).
    private void openNode(Long studentId, LearningNode target, Long pathId) {
        StudentNodeProgress tp = getProgress(studentId, pathId, target.getNodeId());
        if (tp != null && tp.getStatus() == StudentProgressStatus.LOCKED) {
            tp.setStatus(StudentProgressStatus.OPEN);
            tp.setUnlockedAt(LocalDateTime.now());
            studentNodeProgressRepository.save(tp);
        }
    }

    // Mở node kế nhánh chính nếu đủ điều kiện tiên quyết; node ON_CLASS chờ giáo viên mở
    private void openMainTargetIfEligible(Long studentId, LearningNode target, Long pathId) {
        // TODO: tự mở node ON_CLASS khi tới giờ buổi học (chưa có thuộc tính thời gian) — hiện chỉ giáo viên mở.
        if (target.getNodeType() == NodeType.ON_CLASS) return;
        if (target.getLevel() != null && !matchesStudentLevel(studentId, target)) return;
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
    // package-private để unit-test trực tiếp lõi định tuyến cổng.
    void routeGateNode(Long studentId, LearningNode gateNode, Long pathId, BigDecimal percentage) {
        StudentNodeProgress gp = getProgress(studentId, pathId, gateNode.getNodeId());
        if (gp != null) {
            if (gp.getStatus() != StudentProgressStatus.COMPLETED) {
                gp.setStatus(StudentProgressStatus.COMPLETED);
                gp.setCompletedAt(LocalDateTime.now());
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
        if (!passed) {
            return;
        }
        // Hoàn thành node free-choice đã chọn.
        StudentNodeProgress gp = getProgress(studentId, pathId, fcNode.getNodeId());
        if (gp != null) {
            if (gp.getStatus() != StudentProgressStatus.COMPLETED) {
                gp.setStatus(StudentProgressStatus.COMPLETED);
                gp.setCompletedAt(LocalDateTime.now());
            }
            studentNodeProgressRepository.save(gp);
        }
        // Khóa 2 node free-choice còn lại cùng chặng — học sinh đã chọn nhánh.
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
        // Đặt mức = nhánh đã chọn (đổi mức → mở nhánh đích, khóa nhánh mức cũ).
        ClassroomSubject cs = fcNode.getLearningPath().getClassroomSubject();
        if (cs != null) {
            levelRoutingService.applyFreeChoiceRouting(cs.getId(), fcNode, studentId);
        }
        // 4) Mở node chặng sau khớp mức (xử lý cả khi mức không đổi).
        for (NodeEdge edge : nodeEdgeRepository.findByFromNodeNodeId(fcNode.getNodeId())) {
            openMainTargetIfEligible(studentId, edge.getToNode(), pathId);
        }
    }

    private void routeMainNode(Long studentId, LearningNode node, Long pathId, boolean passed) {
        StudentNodeProgress current = getProgress(studentId, pathId, node.getNodeId());
        if (current == null) return;

        if (passed) {
            if (current.getStatus() != StudentProgressStatus.COMPLETED) {
                if (!allNodeTestsPassed(studentId, node)) return;
                current.setStatus(StudentProgressStatus.COMPLETED);
                current.setCompletedAt(LocalDateTime.now());
                studentNodeProgressRepository.save(current);
            }
            for (NodeEdge edge : nodeEdgeRepository.findByFromNodeNodeId(node.getNodeId())) {
                openMainTargetIfEligible(studentId, edge.getToNode(), pathId);
            }
        }
        // Trượt → được thi lại, giữ nguyên trạng thái.
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

    @Override
    @Transactional(readOnly = true)
    public List<StudentTestAttemptHistoryResponse> getStudentTestAttemptHistory(Long studentId) {
        List<StudentTestAttempt> attempts = studentTestAttemptRepository.findByStudentUserIdOrderBySubmittedAtDesc(studentId);
        
        return attempts.stream().map(a -> {
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
                    .build();
        }).collect(Collectors.toList());
    }
}

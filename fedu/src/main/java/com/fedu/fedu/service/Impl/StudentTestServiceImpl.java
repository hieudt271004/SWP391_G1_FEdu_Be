package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.StudentTestService;
import com.fedu.fedu.utils.enums.BranchType;
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

        if (test.getLearningNode() == null) {
            throw new com.fedu.fedu.exception.InvalidDataException(
                    "Bài test phân loại: hãy dùng endpoint nộp bài phân loại (placement).");
        }

        BigDecimal finalPercentage = gradeAttempt(test, attempt, request);
        boolean passed = finalPercentage.compareTo(test.getPassingPercentage()) >= 0;

        // Định tuyến sau khi nộp: đậu đi tiếp / trượt rẽ nhánh phụ + khóa test node hiện tại
        routeAfterAttempt(studentId, test.getLearningNode(),
                test.getLearningNode().getLearningPath().getPathId(), passed);

        // Cổng test: nếu test có khoảng điểm (score band) → đổi mức năng lực của học sinh.
        com.fedu.fedu.entity.ClassroomSubject cs = test.getLearningNode().getLearningPath().getClassroomSubject();
        if (cs != null) {
            levelRoutingService.applyGateBands(cs.getId(), test.getTestId(), studentId, finalPercentage);
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

    /**
     * Chấm điểm một lượt thi: lưu từng câu trả lời, set điểm % và thời điểm nộp cho attempt.
     * Dùng chung cho test theo node, bài phân loại (placement) và cổng test. Không định tuyến.
     */
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

        if (Boolean.TRUE.equals(progress.getTestLocked())) {
            throw new AccessDeniedException("Bài test đang khóa — hãy hoàn thành nhánh phụ trước khi làm lại");
        }
    }

    // ── Định tuyến tiến độ sau mỗi lần nộp test ───────────────────────────────

    /** Cạnh "rẽ nhánh phụ / trượt" = mang ngưỡng điểm (maxScore) hoặc branchName SUB. */
    private boolean isSubEdge(NodeEdge e) {
        return e.getBranchName() == BranchType.SUB || e.getMaxScore() != null;
    }

    private boolean isSubNode(LearningNode node, List<NodeEdge> incoming) {
        return node.getBranchName() == BranchType.SUB
                || incoming.stream().anyMatch(this::isSubEdge);
    }

    private StudentNodeProgress getProgress(Long studentId, Long pathId, Long nodeId) {
        return studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, pathId)
                .stream()
                .filter(p -> p.getLearningNode().getNodeId().equals(nodeId))
                .findFirst()
                .orElse(null);
    }

    /** Mọi test bắt buộc của node đã có ít nhất 1 lượt đạt? */
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

    /** Mở 1 node nếu đang LOCKED (không xét điều kiện tiên quyết). */
    private void openNode(Long studentId, LearningNode target, Long pathId) {
        StudentNodeProgress tp = getProgress(studentId, pathId, target.getNodeId());
        if (tp != null && tp.getStatus() == StudentProgressStatus.LOCKED) {
            tp.setStatus(StudentProgressStatus.OPEN);
            tp.setUnlockedAt(LocalDateTime.now());
            studentNodeProgressRepository.save(tp);
        }
    }

    /** Mở node kế nhánh chính nếu đủ điều kiện tiên quyết; node ON_CLASS chờ giáo viên mở. */
    private void openMainTargetIfEligible(Long studentId, LearningNode target, Long pathId) {
        // TODO: tự mở node ON_CLASS khi tới giờ buổi học (chưa có thuộc tính thời gian) — hiện chỉ giáo viên mở.
        if (target.getNodeType() == NodeType.ON_CLASS) return;
        if (!checkIncomingPrerequisites(studentId, target, pathId)) return;
        openNode(studentId, target, pathId);
    }

    private void routeAfterAttempt(Long studentId, LearningNode node, Long pathId, boolean passed) {
        List<NodeEdge> incoming = nodeEdgeRepository.findByToNodeNodeId(node.getNodeId());
        if (isSubNode(node, incoming)) {
            routeSubNode(studentId, node, pathId, passed, incoming);
        } else {
            routeMainNode(studentId, node, pathId, passed);
        }
    }

    private void routeMainNode(Long studentId, LearningNode node, Long pathId, boolean passed) {
        StudentNodeProgress current = getProgress(studentId, pathId, node.getNodeId());
        if (current == null) return;

        List<NodeEdge> outgoing = nodeEdgeRepository.findByFromNodeNodeId(node.getNodeId());

        if (passed) {
            if (current.getStatus() != StudentProgressStatus.COMPLETED) {
                if (!allNodeTestsPassed(studentId, node)) return;
                current.setStatus(StudentProgressStatus.COMPLETED);
                current.setCompletedAt(LocalDateTime.now());
            }
            current.setTestLocked(false);
            studentNodeProgressRepository.save(current);

            for (NodeEdge edge : outgoing) {
                if (isSubEdge(edge)) continue; // đậu thì KHÔNG mở nhánh phụ
                openMainTargetIfEligible(studentId, edge.getToNode(), pathId);
            }
        } else {
            NodeEdge subEdge = outgoing.stream().filter(this::isSubEdge).findFirst().orElse(null);
            if (subEdge != null) {
                // Trượt + có nhánh phụ → khóa test node này, mở node phụ #1
                current.setTestLocked(true);
                studentNodeProgressRepository.save(current);
                openNode(studentId, subEdge.getToNode(), pathId);
            }
            // Không có nhánh phụ → được thi lại, giữ nguyên trạng thái.
        }
    }

    private void routeSubNode(Long studentId, LearningNode node, Long pathId, boolean passed, List<NodeEdge> incoming) {
        StudentNodeProgress current = getProgress(studentId, pathId, node.getNodeId());
        if (current == null) return;

        NodeEdge parentEdge = incoming.stream().filter(this::isSubEdge).findFirst()
                .orElse(incoming.stream().findFirst().orElse(null));
        LearningNode parent = parentEdge != null ? parentEdge.getFromNode() : null;
        boolean parentIsSub = parent != null
                && isSubNode(parent, nodeEdgeRepository.findByToNodeNodeId(parent.getNodeId()));

        if (!parentIsSub) {
            // node phụ #1 — cổng thoát nhánh phụ
            if (passed) {
                current.setStatus(StudentProgressStatus.COMPLETED);
                current.setCompletedAt(LocalDateTime.now());
                studentNodeProgressRepository.save(current);
                // Đạt phụ #1 → mở lại test node chính
                if (parent != null) {
                    StudentNodeProgress mainP = getProgress(studentId, pathId, parent.getNodeId());
                    if (mainP != null) {
                        mainP.setTestLocked(false);
                        studentNodeProgressRepository.save(mainP);
                    }
                }
            } else {
                // Trượt phụ #1 → mở phụ #2 (luyện thêm) nếu có
                NodeEdge subEdge = nodeEdgeRepository.findByFromNodeNodeId(node.getNodeId())
                        .stream().filter(this::isSubEdge).findFirst().orElse(null);
                if (subEdge != null) openNode(studentId, subEdge.getToNode(), pathId);
            }
        } else {
            // node phụ #2 — làm xong thì quay lại làm phụ #1 (cổng thoát vẫn là đạt phụ #1)
            if (passed) {
                current.setStatus(StudentProgressStatus.COMPLETED);
                current.setCompletedAt(LocalDateTime.now());
                studentNodeProgressRepository.save(current);
            }
            StudentNodeProgress p1 = getProgress(studentId, pathId, parent.getNodeId());
            if (p1 != null && p1.getStatus() != StudentProgressStatus.COMPLETED) {
                p1.setStatus(StudentProgressStatus.OPEN);
                p1.setUnlockedAt(LocalDateTime.now());
                studentNodeProgressRepository.save(p1);
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

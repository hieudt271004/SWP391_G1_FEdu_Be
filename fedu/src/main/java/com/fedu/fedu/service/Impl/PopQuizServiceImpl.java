package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.req.CreatePopQuizRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.PopQuizService;
import com.fedu.fedu.service.StudentTestService;
import com.fedu.fedu.utils.enums.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PopQuizServiceImpl implements PopQuizService {

    private static final long GRACE_SECONDS = 5;

    private final LearningNodeRepository learningNodeRepository;
    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final TestRepository testRepository;
    private final TestQuestionRepository testQuestionRepository;
    private final TestAnswerRepository testAnswerRepository;
    private final StudentTestAttemptRepository studentTestAttemptRepository;
    private final UserAccountRepository userAccountRepository;
    private final TestAssignmentRepository testAssignmentRepository;
    private final TestAssignmentStudentRepository testAssignmentStudentRepository;
    private final StudentTestService studentTestService;

    

    @Override
    @Transactional
    public PopQuizAssignmentResponse createAndAssign(Long nodeId, CreatePopQuizRequest request, Long teacherId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy buổi học"));
        if (node.getNodeType() != NodeType.ON_CLASS) {
            throw new InvalidDataException("Chỉ có thể giao pop quiz trong buổi học ON_CLASS");
        }
        ClassroomSubject cs = node.getLearningPath().getClassroomSubject();
        if (cs == null) {
            throw new InvalidDataException("Buổi học này thuộc lộ trình mẫu, không thể giao pop quiz");
        }
        com.fedu.fedu.utils.ClassroomGuards.assertOpen(cs);
        if (cs.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
        if (request.getCloseAt() != null && !request.getCloseAt().isAfter(LocalDateTime.now())) {
            throw new InvalidDataException("Thời gian tự đóng phải ở tương lai");
        }

        List<Long> studentIds = new ArrayList<>(new LinkedHashSet<>(request.getStudentIds()));
        List<ClassroomSubjectStudent> targets = new ArrayList<>();
        for (Long studentId : studentIds) {
            ClassroomSubjectStudent css = classroomSubjectStudentRepository
                    .findByClassroomSubject_IdAndStudent_UserId(cs.getId(), studentId)
                    .orElseThrow(() -> new InvalidDataException("Học sinh id " + studentId + " không thuộc lớp-môn này"));
            targets.add(css);
        }

        Test test = request.getExistingTestId() != null
                ? resolveExistingTest(request.getExistingTestId(), teacherId)
                : createInlineTest(request);

        UserAccount teacher = userAccountRepository.findById(teacherId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy giáo viên"));

        TestAssignment assignment = TestAssignment.builder()
                .test(test)
                .node(node)
                .classroomSubject(cs)
                .assignedBy(teacher)
                .status(PopQuizAssignmentStatus.OPEN)
                .closeAt(request.getCloseAt())
                .build();
        assignment = testAssignmentRepository.save(assignment);

        for (ClassroomSubjectStudent css : targets) {
            TestAssignmentStudent row = TestAssignmentStudent.builder()
                    .assignment(assignment)
                    .classroomSubjectStudent(css)
                    .status(PopQuizStudentStatus.PENDING)
                    .build();
            testAssignmentStudentRepository.save(row);
        }

        return PopQuizAssignmentResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .testId(test.getTestId())
                .nodeId(node.getNodeId())
                .title(test.getTitle())
                .durationMinutes(test.getDurationMinutes())
                .status(assignment.getStatus())
                .closeAt(assignment.getCloseAt())
                .targetStudentCount(targets.size())
                .build();
    }

    @Override
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public PopQuizAssignmentResponse getActiveAssignment(Long nodeId, Long teacherId) {
        LearningNode node = learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy buổi học"));
        ClassroomSubject cs = node.getLearningPath().getClassroomSubject();
        if (cs != null && cs.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
        List<TestAssignment> assignments = testAssignmentRepository.findByNodeNodeIdAndIsDeletedFalseOrderByCreatedAtDesc(nodeId);
        if (assignments.isEmpty()) {
            return null;
        }
        TestAssignment active = assignments.get(0);
        return PopQuizAssignmentResponse.builder()
                .assignmentId(active.getAssignmentId())
                .testId(active.getTest().getTestId())
                .nodeId(node.getNodeId())
                .title(active.getTest().getTitle())
                .durationMinutes(active.getTest().getDurationMinutes())
                .status(active.getStatus())
                .closeAt(active.getCloseAt())
                .build();
    }

    private Test resolveExistingTest(Long existingTestId, Long teacherId) {
        Test test = testRepository.findById(existingTestId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy bài test"));
        if (Boolean.TRUE.equals(test.getIsDeleted())) {
            throw new InvalidDataException("Bài test đã bị xóa");
        }
        if (test.getDurationMinutes() == null) {
            throw new InvalidDataException("Bài test có sẵn chưa cấu hình thời gian làm bài");
        }
        if (!teacherOwnsTest(test, teacherId)) {
            throw new AccessDeniedException("Bạn không có quyền dùng bài test này");
        }
        List<TestQuestion> questions = testQuestionRepository.findByTestTestId(existingTestId);
        if (questions.isEmpty()) {
            throw new InvalidDataException("Bài test có sẵn chưa có câu hỏi nào");
        }
        for (TestQuestion q : questions) {
            requireAutoGradable(q.getQuestionType());
        }
        return test;
    }

    private boolean teacherOwnsTest(Test test, Long teacherId) {
        if (test.getLearningNode() != null) {
            ClassroomSubject cs = test.getLearningNode().getLearningPath().getClassroomSubject();
            return cs != null && cs.getLecturer().getUserId() == teacherId;
        }
        return classroomSubjectRepository.findByQuizStartTestId(test.getTestId())
                .map(cs -> cs.getLecturer().getUserId() == teacherId)
                .orElse(false);
    }

    private Test createInlineTest(CreatePopQuizRequest request) {
        if (request.getDurationMinutes() == null) {
            throw new InvalidDataException("Thời gian làm bài là bắt buộc");
        }
        if (request.getDurationMinutes() < 1 || request.getDurationMinutes() > 180) {
            throw new InvalidDataException("Thời gian làm bài phải từ 1 đến 180 phút");
        }
        for (CreatePopQuizRequest.QuestionInput q : request.getQuestions()) {
            requireAutoGradable(q.getQuestionType());
            validateAnswerComposition(q);
        }

        Test test = Test.builder()
                .title(request.getTitle())
                .durationMinutes(request.getDurationMinutes())
                .testKind(TestKind.POP_QUIZ)
                .isDeleted(false)
                .build();
        test = testRepository.save(test);

        for (CreatePopQuizRequest.QuestionInput q : request.getQuestions()) {
            TestQuestion question = TestQuestion.builder()
                    .test(test)
                    .questionContent(q.getQuestionContent())
                    .questionType(q.getQuestionType())
                    .score(q.getScore() != null ? q.getScore() : BigDecimal.ONE)
                    .build();
            question = testQuestionRepository.save(question);
            for (CreatePopQuizRequest.AnswerInput a : q.getAnswers()) {
                TestAnswer answer = TestAnswer.builder()
                        .question(question)
                        .answerContent(a.getAnswerContent())
                        .isCorrect(Boolean.TRUE.equals(a.getIsCorrect()))
                        .build();
                testAnswerRepository.save(answer);
            }
        }
        return test;
    }

    private void requireAutoGradable(QuestionType type) {
        if (type != QuestionType.MULTIPLE_CHOICE && type != QuestionType.TRUE_FALSE && type != QuestionType.MULTIPLE_SELECT) {
            throw new InvalidDataException("Pop quiz chỉ nhận câu hỏi trắc nghiệm/đúng-sai, không nhận tự luận/trả lời ngắn");
        }
    }

    private void validateAnswerComposition(CreatePopQuizRequest.QuestionInput q) {
        long correctCount = q.getAnswers().stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
        if ((q.getQuestionType() == QuestionType.MULTIPLE_CHOICE || q.getQuestionType() == QuestionType.TRUE_FALSE) && correctCount != 1) {
            throw new InvalidDataException("Câu hỏi trắc nghiệm/đúng-sai phải có đúng 1 đáp án đúng");
        }
        if (q.getQuestionType() == QuestionType.MULTIPLE_SELECT && correctCount < 1) {
            throw new InvalidDataException("Câu hỏi nhiều lựa chọn phải có ít nhất 1 đáp án đúng");
        }
    }

    @Override
    @Transactional
    public PopQuizResultsResponse getResults(Long assignmentId, Long teacherId) {
        TestAssignment assignment = requireAssignmentOwnedByTeacher(assignmentId, teacherId);
        List<TestAssignmentStudent> rows = testAssignmentStudentRepository.findByAssignmentIdWithDetails(assignmentId);

        List<PopQuizResultsResponse.StudentResult> results = new ArrayList<>();
        for (TestAssignmentStudent row : rows) {
            if (row.getStatus() == PopQuizStudentStatus.IN_PROGRESS) {
                
                testAssignmentStudentRepository.findByIdForUpdate(row.getId());
                finalizeIfExpired(row);
            }
            UserAccount student = row.getClassroomSubjectStudent().getStudent();
            StudentTestAttempt attempt = row.getAttempt();
            results.add(PopQuizResultsResponse.StudentResult.builder()
                    .studentId(student.getUserId())
                    .studentName((student.getLastName() + " " + student.getFirstName()).trim())
                    .status(row.getStatus())
                    .score(attempt != null ? attempt.getScore() : null)
                    .tabOutCount(attempt != null ? attempt.getTabOutCount() : null)
                    .build());
        }

        return PopQuizResultsResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .title(assignment.getTest().getTitle())
                .status(assignment.getStatus())
                .students(results)
                .build();
    }

    @Override
    @Transactional
    public void resetStudent(Long assignmentId, Long classroomSubjectStudentId, Long teacherId) {
        requireAssignmentOwnedByTeacher(assignmentId, teacherId);
        TestAssignmentStudent row = testAssignmentStudentRepository
                .findByAssignmentAssignmentIdAndClassroomSubjectStudentId(assignmentId, classroomSubjectStudentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh trong lượt giao này"));

        StudentTestAttempt attempt = row.getAttempt();
        if (attempt != null) {
            
            attempt.setStatus(AttemptStatus.CANCELLED);
            studentTestAttemptRepository.save(attempt);
        }
        row.setAttempt(null);
        row.setStatus(PopQuizStudentStatus.PENDING);
        testAssignmentStudentRepository.save(row);
    }

    @Override
    @Transactional
    public void closeAssignment(Long assignmentId, Long teacherId) {
        TestAssignment assignment = requireAssignmentOwnedByTeacher(assignmentId, teacherId);
        assignment.setStatus(PopQuizAssignmentStatus.CLOSED);
        testAssignmentRepository.save(assignment);
    }

    private TestAssignment requireAssignmentOwnedByTeacher(Long assignmentId, Long teacherId) {
        TestAssignment assignment = testAssignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lượt giao pop quiz"));
        if (assignment.getClassroomSubject().getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này");
        }
        return assignment;
    }

    

    @Override
    @Transactional
    public PopQuizPendingResponse getPending(Long nodeId, Long studentId) {
        List<TestAssignmentStudent> candidates = testAssignmentStudentRepository
                .findByNodeIdAndStudentIdOrderByAssignmentCreatedAtDesc(nodeId, studentId);
        return processPendingCandidate(candidates);
    }

    @Override
    @Transactional
    public PopQuizPendingResponse getPendingByClassroomSubject(Long classroomSubjectId, Long studentId) {
        List<TestAssignmentStudent> candidates = testAssignmentStudentRepository
                .findByClassroomSubjectIdAndStudentIdOrderByAssignmentCreatedAtDesc(classroomSubjectId, studentId);
        return processPendingCandidate(candidates);
    }

    private PopQuizPendingResponse processPendingCandidate(List<TestAssignmentStudent> candidates) {
        if (candidates.isEmpty()) {
            return null;
        }
        TestAssignmentStudent row = candidates.get(0);

        if (row.getStatus() == PopQuizStudentStatus.IN_PROGRESS) {
            testAssignmentStudentRepository.findByIdForUpdate(row.getId());
            finalizeIfExpired(row);
        }

        TestAssignment assignment = row.getAssignment();
        if (row.getStatus() == PopQuizStudentStatus.PENDING && isClosed(assignment)) {
            return null;
        }

        PopQuizPendingResponse.PopQuizPendingResponseBuilder builder = PopQuizPendingResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .title(assignment.getTest().getTitle())
                .durationMinutes(assignment.getTest().getDurationMinutes())
                .status(row.getStatus());

        if (row.getStatus() == PopQuizStudentStatus.IN_PROGRESS && row.getAttempt() != null) {
            builder.remainingSeconds(remainingSeconds(row.getAttempt()));
        }
        if ((row.getStatus() == PopQuizStudentStatus.SUBMITTED || row.getStatus() == PopQuizStudentStatus.EXPIRED)
                && row.getAttempt() != null) {
            builder.score(row.getAttempt().getScore());
        }
        return builder.build();
    }

    @Override
    @Transactional
    public PopQuizPaperResponse startAttempt(Long assignmentId, Long studentId) {
        TestAssignmentStudent row = testAssignmentStudentRepository
                .findByAssignmentIdAndStudentIdForUpdate(assignmentId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không được giao bài kiểm tra này"));

        if (row.getAttempt() != null) {
            throw new InvalidDataException("Bạn đã bắt đầu làm bài này rồi");
        }
        TestAssignment assignment = row.getAssignment();
        if (isClosed(assignment)) {
            throw new InvalidDataException("Bài kiểm tra đã đóng");
        }

        UserAccount student = userAccountRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy học sinh"));

        StudentTestAttempt attempt = StudentTestAttempt.builder()
                .test(assignment.getTest())
                .student(student)
                .startedAt(LocalDateTime.now())
                .status(AttemptStatus.IN_PROGRESS)
                .build();
        attempt = studentTestAttemptRepository.save(attempt);

        row.setAttempt(attempt);
        row.setStatus(PopQuizStudentStatus.IN_PROGRESS);
        testAssignmentStudentRepository.save(row);

        return buildPaper(assignment, attempt);
    }

    @Override
    @Transactional
    public PopQuizPaperResponse getPaper(Long assignmentId, Long studentId) {
        TestAssignmentStudent row = testAssignmentStudentRepository
                .findByAssignmentIdAndStudentIdForUpdate(assignmentId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không được giao bài kiểm tra này"));
        if (row.getAttempt() == null) {
            throw new InvalidDataException("Bạn chưa bắt đầu làm bài này");
        }
        finalizeIfExpired(row);
        if (row.getStatus() != PopQuizStudentStatus.IN_PROGRESS) {
            throw new InvalidDataException("Bài đã kết thúc, không thể lấy lại đề");
        }
        return buildPaper(row.getAssignment(), row.getAttempt());
    }

    @Override
    @Transactional
    public AttemptSubmissionResultResponse submit(Long assignmentId, Long studentId, AttemptSubmissionRequest request) {
        TestAssignmentStudent row = testAssignmentStudentRepository
                .findByAssignmentIdAndStudentIdForUpdate(assignmentId, studentId)
                .orElseThrow(() -> new AccessDeniedException("Bạn không được giao bài kiểm tra này"));
        StudentTestAttempt attempt = row.getAttempt();
        if (attempt == null) {
            throw new InvalidDataException("Bạn chưa bắt đầu làm bài này");
        }
        if (row.getStatus() != PopQuizStudentStatus.IN_PROGRESS) {
            throw new InvalidDataException("Bài đã được nộp hoặc đã kết thúc");
        }

        if (finalizeIfExpired(row)) {
            return AttemptSubmissionResultResponse.builder()
                    .attemptId(attempt.getAttemptId())
                    .score(BigDecimal.ZERO)
                    .passed(false)
                    .startedAt(attempt.getStartedAt())
                    .submittedAt(attempt.getSubmittedAt())
                    .passingPercentage(attempt.getTest().getPassingPercentage())
                    .build();
        }

        BigDecimal score = studentTestService.submitForGrading(
                attempt.getTest().getTestId(), attempt.getAttemptId(), studentId, request);
        row.setStatus(PopQuizStudentStatus.SUBMITTED);
        testAssignmentStudentRepository.save(row);

        return AttemptSubmissionResultResponse.builder()
                .attemptId(attempt.getAttemptId())
                .score(score)
                .startedAt(attempt.getStartedAt())
                .submittedAt(attempt.getSubmittedAt())
                .passingPercentage(attempt.getTest().getPassingPercentage())
                .build();
    }

    

    
    private boolean finalizeIfExpired(TestAssignmentStudent row) {
        if (row.getStatus() != PopQuizStudentStatus.IN_PROGRESS) {
            return false;
        }
        StudentTestAttempt attempt = row.getAttempt();
        if (attempt == null || attempt.getStartedAt() == null || attempt.getTest().getDurationMinutes() == null) {
            return false;
        }
        LocalDateTime deadline = attempt.getStartedAt()
                .plusMinutes(attempt.getTest().getDurationMinutes())
                .plusSeconds(GRACE_SECONDS);
        if (!LocalDateTime.now().isAfter(deadline)) {
            return false;
        }

        attempt.setScore(BigDecimal.ZERO);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setStatus(AttemptStatus.SUBMITTED);
        studentTestAttemptRepository.save(attempt);

        row.setStatus(PopQuizStudentStatus.EXPIRED);
        testAssignmentStudentRepository.save(row);
        return true;
    }

    private boolean isClosed(TestAssignment assignment) {
        if (assignment.getStatus() == PopQuizAssignmentStatus.CLOSED) {
            return true;
        }
        return assignment.getCloseAt() != null && LocalDateTime.now().isAfter(assignment.getCloseAt());
    }

    private long remainingSeconds(StudentTestAttempt attempt) {
        Integer duration = attempt.getTest().getDurationMinutes();
        if (duration == null) {
            return 0;
        }
        LocalDateTime deadline = attempt.getStartedAt().plusMinutes(duration);
        long secs = Duration.between(LocalDateTime.now(), deadline).getSeconds();
        return Math.max(secs, 0);
    }

    
    private PopQuizPaperResponse buildPaper(TestAssignment assignment, StudentTestAttempt attempt) {
        Test test = assignment.getTest();
        List<TestQuestion> questions = new ArrayList<>(testQuestionRepository.findByTestTestId(test.getTestId()));
        questions.sort(Comparator.comparing(TestQuestion::getQuestionId));
        Collections.shuffle(questions, new Random(attempt.getAttemptId()));

        List<QuestionResponse> questionResponses = questions.stream().map(q -> {
            List<TestAnswer> answers = new ArrayList<>(testAnswerRepository.findByQuestionQuestionId(q.getQuestionId()));
            answers.sort(Comparator.comparing(TestAnswer::getAnswerId));
            Collections.shuffle(answers, new Random(attempt.getAttemptId() * 31 + q.getQuestionId()));

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
        }).collect(Collectors.toList());

        return PopQuizPaperResponse.builder()
                .assignmentId(assignment.getAssignmentId())
                .attemptId(attempt.getAttemptId())
                .title(test.getTitle())
                .durationMinutes(test.getDurationMinutes())
                .remainingSeconds(remainingSeconds(attempt))
                .questions(questionResponses)
                .build();
    }
}

package com.fedu.fedu;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.req.CreatePopQuizRequest;
import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.PopQuizService;
import com.fedu.fedu.service.StudentTestService;
import com.fedu.fedu.utils.enums.AttemptStatus;
import com.fedu.fedu.utils.enums.NodeType;
import com.fedu.fedu.utils.enums.PopQuizStudentStatus;
import com.fedu.fedu.utils.enums.QuestionType;
import com.fedu.fedu.utils.enums.TestKind;
import com.fedu.fedu.utils.enums.UserStatus;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class PopQuizIntegrationTest {

    @Autowired private PopQuizService popQuizService;
    @Autowired private StudentTestService studentTestService;
    @Autowired private Validator validator;

    @Autowired private SubjectRepository subjectRepository;
    @Autowired private ClassroomRepository classroomRepository;
    @Autowired private ClassroomSubjectRepository classroomSubjectRepository;
    @Autowired private ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    @Autowired private LearningPathRepository learningPathRepository;
    @Autowired private LearningNodeRepository learningNodeRepository;
    @Autowired private UserAccountRepository userAccountRepository;
    @Autowired private TestRepository testRepository;
    @Autowired private TestQuestionRepository testQuestionRepository;
    @Autowired private TestAnswerRepository testAnswerRepository;
    @Autowired private StudentTestAttemptRepository studentTestAttemptRepository;
    @Autowired private TestAssignmentStudentRepository testAssignmentStudentRepository;

    @Autowired private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    @Autowired private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    private UserAccount teacherA;
    private UserAccount teacherB;
    private UserAccount student1;
    private UserAccount student2;
    private UserAccount studentOutsider;
    private ClassroomSubject classroomSubject;
    private LearningNode onClassNode;
    private ClassroomSubjectStudent css1;
    private ClassroomSubjectStudent css2;

    @BeforeEach
    void setUp() {
        
        
        
        
        transactionTemplate.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transactionTemplate.execute(status -> {
            setUpFixtures();
            return null;
        });
    }

    private void setUpFixtures() {
        
        jdbcTemplate.execute("DELETE FROM test_assignment_students");
        jdbcTemplate.execute("DELETE FROM test_assignments");
        jdbcTemplate.execute("DELETE FROM support_tickets");
        jdbcTemplate.execute("DELETE FROM classroom_sub_mentor");
        jdbcTemplate.execute("DELETE FROM classroom_subject_students");
        jdbcTemplate.execute("DELETE FROM student_selected_answers");
        jdbcTemplate.execute("DELETE FROM student_test_responses");
        jdbcTemplate.execute("DELETE FROM student_test_attempts");
        jdbcTemplate.execute("DELETE FROM test_answers");
        jdbcTemplate.execute("DELETE FROM test_questions");
        jdbcTemplate.execute("DELETE FROM tests");
        jdbcTemplate.execute("DELETE FROM videos");
        jdbcTemplate.execute("DELETE FROM files");
        jdbcTemplate.execute("DELETE FROM node_materials");
        jdbcTemplate.execute("DELETE FROM question_answers");
        jdbcTemplate.execute("DELETE FROM node_questions");
        jdbcTemplate.execute("DELETE FROM node_reviews");
        jdbcTemplate.execute("DELETE FROM submissions");
        jdbcTemplate.execute("DELETE FROM student_learning_routes");
        jdbcTemplate.execute("DELETE FROM student_node_progress");
        jdbcTemplate.execute("DELETE FROM node_edges");
        jdbcTemplate.execute("DELETE FROM learning_nodes");
        jdbcTemplate.execute("DELETE FROM learning_paths");
        jdbcTemplate.execute("DELETE FROM classroom_subjects");
        jdbcTemplate.execute("DELETE FROM classrooms");
        jdbcTemplate.execute("DELETE FROM subjects");
        jdbcTemplate.execute("DELETE FROM tokens");
        
        
        
        jdbcTemplate.execute("DELETE FROM user_account WHERE email LIKE '%@popquiz.test'");

        Subject subject = subjectRepository.save(Subject.builder()
                .subjectCode("POPQUIZ")
                .subjectName("Pop Quiz Subject")
                .status("draft")
                .isDeleted(false)
                .build());

        Classroom classroom = classroomRepository.save(Classroom.builder()
                .className("PQ101")
                .status("active")
                .isDeleted(false)
                .build());

        teacherA = saveUser("teacherA@popquiz.test");
        teacherB = saveUser("teacherB@popquiz.test");
        student1 = saveUser("student1@popquiz.test");
        student2 = saveUser("student2@popquiz.test");
        studentOutsider = saveUser("outsider@popquiz.test");

        classroomSubject = classroomSubjectRepository.save(ClassroomSubject.builder()
                .classroom(classroom)
                .subject(subject)
                .lecturer(teacherA)
                .build());

        LearningPath clonedPath = learningPathRepository.save(LearningPath.builder()
                .subject(subject)
                .pathName("PQ Path")
                .classroomSubject(classroomSubject)
                .isDeleted(false)
                .build());

        onClassNode = learningNodeRepository.save(LearningNode.builder()
                .learningPath(clonedPath)
                .title("Buổi học 1")
                .nodeType(NodeType.ON_CLASS)
                .isRequired(true)
                .isDeleted(false)
                .build());

        css1 = classroomSubjectStudentRepository.save(ClassroomSubjectStudent.builder()
                .classroomSubject(classroomSubject)
                .student(student1)
                .currentLevel(2)
                .build());
        css2 = classroomSubjectStudentRepository.save(ClassroomSubjectStudent.builder()
                .classroomSubject(classroomSubject)
                .student(student2)
                .currentLevel(2)
                .build());
    }

    private UserAccount saveUser(String email) {
        return userAccountRepository.save(UserAccount.builder()
                .email(email)
                .password("password")
                .firstName("First")
                .lastName("Last")
                .status(UserStatus.ACTIVE)
                .userRoles(Collections.emptyList())
                .isDeleted(false)
                .build());
    }

    private CreatePopQuizRequest.QuestionInput mcQuestion(String content, int correctIndex, String... options) {
        List<CreatePopQuizRequest.AnswerInput> answers = new ArrayList<>();
        for (int i = 0; i < options.length; i++) {
            answers.add(CreatePopQuizRequest.AnswerInput.builder()
                    .answerContent(options[i])
                    .isCorrect(i == correctIndex)
                    .build());
        }
        return CreatePopQuizRequest.QuestionInput.builder()
                .questionContent(content)
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .score(BigDecimal.ONE)
                .answers(answers)
                .build();
    }

    private CreatePopQuizRequest inlineRequest(List<Long> studentIds) {
        return CreatePopQuizRequest.builder()
                .title("Pop Quiz Nhanh")
                .durationMinutes(10)
                .studentIds(studentIds)
                .questions(List.of(
                        mcQuestion("2 + 2 = ?", 1, "3", "4", "5"),
                        mcQuestion("Thủ đô Việt Nam?", 0, "Hà Nội", "Đà Nẵng")
                ))
                .build();
    }

    

    @Test
    void fullFlow_assignPollStartSubmitResetRetakeClose() {
        PopQuizAssignmentResponse assignment = popQuizService.createAndAssign(
                onClassNode.getNodeId(),
                inlineRequest(List.of(student1.getUserId(), student2.getUserId())),
                teacherA.getUserId());

        assertNotNull(assignment.getAssignmentId());
        com.fedu.fedu.entity.Test createdTest = testRepository.findById(assignment.getTestId()).orElseThrow();
        assertEquals(TestKind.POP_QUIZ, createdTest.getTestKind());
        assertEquals(2, assignment.getTargetStudentCount());

        
        PopQuizPendingResponse pendingS1 = popQuizService.getPending(onClassNode.getNodeId(), student1.getUserId());
        assertNotNull(pendingS1);
        assertEquals(PopQuizStudentStatus.PENDING, pendingS1.getStatus());
        assertNull(popQuizService.getPending(onClassNode.getNodeId(), studentOutsider.getUserId()));

        
        PopQuizPaperResponse paper = popQuizService.startAttempt(assignment.getAssignmentId(), student1.getUserId());
        assertEquals(2, paper.getQuestions().size());
        List<Long> firstOrder = paper.getQuestions().stream().map(QuestionResponse::getQuestionId).toList();

        assertThrows(InvalidDataException.class,
                () -> popQuizService.startAttempt(assignment.getAssignmentId(), student1.getUserId()));

        
        PopQuizPaperResponse refetched = popQuizService.getPaper(assignment.getAssignmentId(), student1.getUserId());
        List<Long> secondOrder = refetched.getQuestions().stream().map(QuestionResponse::getQuestionId).toList();
        assertEquals(firstOrder, secondOrder);

        
        AttemptSubmissionRequest submission = buildCorrectSubmission(paper);
        AttemptSubmissionResultResponse result = popQuizService.submit(assignment.getAssignmentId(), student1.getUserId(), submission);
        assertEquals(0, BigDecimal.valueOf(100).compareTo(result.getScore()));

        ClassroomSubjectStudent refreshedCss1 = classroomSubjectStudentRepository.findById(css1.getId()).orElseThrow();
        assertEquals(2, refreshedCss1.getCurrentLevel()); 

        
        Long firstAttemptId = result.getAttemptId();
        popQuizService.resetStudent(assignment.getAssignmentId(), css1.getId(), teacherA.getUserId());
        StudentTestAttempt cancelled = studentTestAttemptRepository.findById(firstAttemptId).orElseThrow();
        assertEquals(AttemptStatus.CANCELLED, cancelled.getStatus());

        PopQuizPaperResponse retakePaper = popQuizService.startAttempt(assignment.getAssignmentId(), student1.getUserId());
        assertNotEquals(firstAttemptId, retakePaper.getAttemptId());

        
        popQuizService.closeAssignment(assignment.getAssignmentId(), teacherA.getUserId());
        assertThrows(InvalidDataException.class,
                () -> popQuizService.startAttempt(assignment.getAssignmentId(), student2.getUserId()));

        AttemptSubmissionResultResponse retakeResult = popQuizService.submit(
                assignment.getAssignmentId(), student1.getUserId(), buildCorrectSubmission(retakePaper));
        assertNotNull(retakeResult.getScore());

        PopQuizResultsResponse finalResults = popQuizService.getResults(assignment.getAssignmentId(), teacherA.getUserId());
        assertEquals(2, finalResults.getStudents().size());
    }

    @Test
    void nonLecturer_cannotAssignOrSeeResults() {
        assertThrows(AccessDeniedException.class, () -> popQuizService.createAndAssign(
                onClassNode.getNodeId(), inlineRequest(List.of(student1.getUserId())), teacherB.getUserId()));

        PopQuizAssignmentResponse assignment = popQuizService.createAndAssign(
                onClassNode.getNodeId(), inlineRequest(List.of(student1.getUserId())), teacherA.getUserId());
        assertThrows(AccessDeniedException.class,
                () -> popQuizService.getResults(assignment.getAssignmentId(), teacherB.getUserId()));
    }

    @Test
    void studentNotEnrolled_rejectsEntireRequest() {
        assertThrows(InvalidDataException.class, () -> popQuizService.createAndAssign(
                onClassNode.getNodeId(),
                inlineRequest(List.of(student1.getUserId(), studentOutsider.getUserId())),
                teacherA.getUserId()));
        assertEquals(0, testRepository.count());
    }

    

    @Test
    void expiredAttempt_finalizedToZero_atResultsAndAtSubmit() {
        PopQuizAssignmentResponse assignment = popQuizService.createAndAssign(
                onClassNode.getNodeId(),
                inlineRequest(List.of(student1.getUserId(), student2.getUserId())),
                teacherA.getUserId());

        popQuizService.startAttempt(assignment.getAssignmentId(), student1.getUserId());
        backdateAttemptStart(assignment.getAssignmentId(), student1.getUserId(), 30);

        
        PopQuizResultsResponse results = popQuizService.getResults(assignment.getAssignmentId(), teacherA.getUserId());
        PopQuizResultsResponse.StudentResult s1 = results.getStudents().stream()
                .filter(s -> s.getStudentId() == student1.getUserId()).findFirst().orElseThrow();
        assertEquals(PopQuizStudentStatus.EXPIRED, s1.getStatus());
        assertEquals(0, BigDecimal.ZERO.compareTo(s1.getScore()));

        
        PopQuizPendingResponse pending = popQuizService.getPending(onClassNode.getNodeId(), student1.getUserId());
        assertEquals(PopQuizStudentStatus.EXPIRED, pending.getStatus());

        
        popQuizService.startAttempt(assignment.getAssignmentId(), student2.getUserId());
        backdateAttemptStart(assignment.getAssignmentId(), student2.getUserId(), 30);
        AttemptSubmissionResultResponse lateResult = popQuizService.submit(
                assignment.getAssignmentId(), student2.getUserId(),
                AttemptSubmissionRequest.builder().submissions(List.of()).build());
        assertEquals(0, BigDecimal.ZERO.compareTo(lateResult.getScore()));

        
        assertThrows(InvalidDataException.class,
                () -> popQuizService.getPaper(assignment.getAssignmentId(), student2.getUserId()));
    }

    private void backdateAttemptStart(Long assignmentId, long studentId, int minutesAgo) {
        TestAssignmentStudent row = testAssignmentStudentRepository
                .findByAssignmentAssignmentIdAndClassroomSubjectStudentId(assignmentId,
                        classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(classroomSubject.getId(), studentId)
                                .orElseThrow().getId())
                .orElseThrow();
        StudentTestAttempt attempt = row.getAttempt();
        attempt.setStartedAt(LocalDateTime.now().minusMinutes(minutesAgo));
        studentTestAttemptRepository.save(attempt);
    }

    

    @Test
    void popQuizTest_blockedFromGenericStudentEndpoints() {
        PopQuizAssignmentResponse assignment = popQuizService.createAndAssign(
                onClassNode.getNodeId(), inlineRequest(List.of(student1.getUserId())), teacherA.getUserId());

        assertThrows(AccessDeniedException.class,
                () -> studentTestService.getStudentTestDetails(assignment.getTestId(), student1.getUserId()));
        assertThrows(AccessDeniedException.class,
                () -> studentTestService.startTestAttempt(assignment.getTestId(), student1.getUserId()));
    }

    @Test
    void popQuizAttempt_excludedFromGenericHistory_tabOutStillWorks() {
        PopQuizAssignmentResponse assignment = popQuizService.createAndAssign(
                onClassNode.getNodeId(), inlineRequest(List.of(student1.getUserId())), teacherA.getUserId());
        PopQuizPaperResponse paper = popQuizService.startAttempt(assignment.getAssignmentId(), student1.getUserId());

        int count = studentTestService.recordTabOut(assignment.getTestId(), paper.getAttemptId(), student1.getUserId());
        assertEquals(1, count);

        popQuizService.submit(assignment.getAssignmentId(), student1.getUserId(), buildCorrectSubmission(paper));

        List<StudentTestAttemptHistoryResponse> history = studentTestService.getStudentTestAttemptHistory(student1.getUserId());
        assertTrue(history.stream().noneMatch(h -> h.getAttemptId().equals(paper.getAttemptId())));
    }

    @Test
    void concurrentStart_onlyOneAttemptWins() throws InterruptedException {
        
        
        PopQuizAssignmentResponse assignment = transactionTemplate.execute(status ->
                popQuizService.createAndAssign(
                        onClassNode.getNodeId(), inlineRequest(List.of(student1.getUserId())), teacherA.getUserId()));

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch finishLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger failureCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    popQuizService.startAttempt(assignment.getAssignmentId(), student1.getUserId());
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    finishLatch.countDown();
                }
            });
        }
        latch.countDown();
        finishLatch.await();
        executor.shutdown();

        assertEquals(1, successCount.get());
        assertEquals(1, failureCount.get());
    }

    

    @Test
    void inlineEssayQuestion_rejected() {
        CreatePopQuizRequest request = CreatePopQuizRequest.builder()
                .title("Bad Quiz")
                .durationMinutes(10)
                .studentIds(List.of(student1.getUserId()))
                .questions(List.of(CreatePopQuizRequest.QuestionInput.builder()
                        .questionContent("Trình bày...")
                        .questionType(QuestionType.ESSAY)
                        .answers(List.of(CreatePopQuizRequest.AnswerInput.builder()
                                .answerContent("gợi ý").isCorrect(true).build()))
                        .build()))
                .build();
        assertThrows(InvalidDataException.class,
                () -> popQuizService.createAndAssign(onClassNode.getNodeId(), request, teacherA.getUserId()));
    }

    @Test
    void inlineMultipleChoiceWithTwoCorrectAnswers_rejected() {
        CreatePopQuizRequest request = CreatePopQuizRequest.builder()
                .title("Bad MC")
                .durationMinutes(10)
                .studentIds(List.of(student1.getUserId()))
                .questions(List.of(CreatePopQuizRequest.QuestionInput.builder()
                        .questionContent("Chọn 1 đáp án")
                        .questionType(QuestionType.MULTIPLE_CHOICE)
                        .answers(List.of(
                                CreatePopQuizRequest.AnswerInput.builder().answerContent("A").isCorrect(true).build(),
                                CreatePopQuizRequest.AnswerInput.builder().answerContent("B").isCorrect(true).build()))
                        .build()))
                .build();
        assertThrows(InvalidDataException.class,
                () -> popQuizService.createAndAssign(onClassNode.getNodeId(), request, teacherA.getUserId()));
    }

    @Test
    void beanValidation_tooManyQuestions_andExclusiveQuestionSource() {
        List<CreatePopQuizRequest.QuestionInput> tooMany = new ArrayList<>();
        for (int i = 0; i < 51; i++) {
            tooMany.add(mcQuestion("Q" + i, 0, "A", "B"));
        }
        CreatePopQuizRequest tooManyRequest = CreatePopQuizRequest.builder()
                .title("Too Many")
                .durationMinutes(10)
                .studentIds(List.of(student1.getUserId()))
                .questions(tooMany)
                .build();
        Set<ConstraintViolation<CreatePopQuizRequest>> violations = validator.validate(tooManyRequest);
        assertFalse(violations.isEmpty());

        CreatePopQuizRequest bothSources = CreatePopQuizRequest.builder()
                .title("Both")
                .durationMinutes(10)
                .studentIds(List.of(student1.getUserId()))
                .questions(List.of(mcQuestion("Q", 0, "A", "B")))
                .existingTestId(999L)
                .build();
        assertFalse(validator.validate(bothSources).isEmpty());

        CreatePopQuizRequest neitherSource = CreatePopQuizRequest.builder()
                .title("Neither")
                .durationMinutes(10)
                .studentIds(List.of(student1.getUserId()))
                .build();
        assertFalse(validator.validate(neitherSource).isEmpty());
    }

    @Test
    void existingTestId_assignsWithoutCreatingNewTest_andRejectsNonAutoGradable() {
        com.fedu.fedu.entity.Test existingTest = testRepository.save(com.fedu.fedu.entity.Test.builder()
                .title("Test có sẵn")
                .durationMinutes(20)
                .testKind(TestKind.NORMAL)
                .isDeleted(false)
                .build());
        classroomSubject.setQuizStart(existingTest);
        classroomSubjectRepository.save(classroomSubject);

        TestQuestion q = testQuestionRepository.save(TestQuestion.builder()
                .test(existingTest)
                .questionContent("Câu hỏi có sẵn")
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .score(BigDecimal.ONE)
                .build());
        testAnswerRepository.save(TestAnswer.builder().question(q).answerContent("Đúng").isCorrect(true).build());
        testAnswerRepository.save(TestAnswer.builder().question(q).answerContent("Sai").isCorrect(false).build());

        long countBefore = testRepository.count();
        CreatePopQuizRequest request = CreatePopQuizRequest.builder()
                .title("Dùng đề có sẵn")
                .studentIds(List.of(student1.getUserId()))
                .existingTestId(existingTest.getTestId())
                .build();
        PopQuizAssignmentResponse assignment = popQuizService.createAndAssign(
                onClassNode.getNodeId(), request, teacherA.getUserId());

        assertEquals(existingTest.getTestId(), assignment.getTestId());
        assertEquals(countBefore, testRepository.count());
        com.fedu.fedu.entity.Test reloaded = testRepository.findById(existingTest.getTestId()).orElseThrow();
        assertEquals(TestKind.NORMAL, reloaded.getTestKind()); 

        
        com.fedu.fedu.entity.Test essayTest = testRepository.save(com.fedu.fedu.entity.Test.builder()
                .title("Essay test")
                .durationMinutes(20)
                .testKind(TestKind.NORMAL)
                .isDeleted(false)
                .build());
        classroomSubject.setQuizStart(essayTest);
        classroomSubjectRepository.save(classroomSubject);
        testQuestionRepository.save(TestQuestion.builder()
                .test(essayTest).questionContent("Tự luận").questionType(QuestionType.ESSAY).score(BigDecimal.ONE).build());

        CreatePopQuizRequest badRequest = CreatePopQuizRequest.builder()
                .title("Bad existing")
                .studentIds(List.of(student1.getUserId()))
                .existingTestId(essayTest.getTestId())
                .build();
        assertThrows(InvalidDataException.class,
                () -> popQuizService.createAndAssign(onClassNode.getNodeId(), badRequest, teacherA.getUserId()));
    }

    

    private AttemptSubmissionRequest buildCorrectSubmission(PopQuizPaperResponse paper) {
        List<AttemptSubmissionRequest.QuestionSubmission> subs = new ArrayList<>();
        for (QuestionResponse q : paper.getQuestions()) {
            List<TestAnswer> answers = testAnswerRepository.findByQuestionQuestionId(q.getQuestionId());
            Long correctAnswerId = answers.stream().filter(TestAnswer::getIsCorrect)
                    .map(TestAnswer::getAnswerId).findFirst().orElseThrow();
            subs.add(AttemptSubmissionRequest.QuestionSubmission.builder()
                    .questionId(q.getQuestionId())
                    .selectedAnswerIds(List.of(correctAnswerId))
                    .build());
        }
        return AttemptSubmissionRequest.builder().submissions(subs).build();
    }
}

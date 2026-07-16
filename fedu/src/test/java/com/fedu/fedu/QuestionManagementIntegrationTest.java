package com.fedu.fedu;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedu.fedu.dto.req.AnswerRequest;
import com.fedu.fedu.dto.req.QuestionRequest;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.utils.enums.QuestionType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class QuestionManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private LearningPathRepository learningPathRepository;

    @Autowired
    private LearningNodeRepository learningNodeRepository;

    @Autowired
    private TestRepository testRepository;

    @Autowired
    private TestQuestionRepository testQuestionRepository;

    @Autowired
    private TestAnswerRepository testAnswerRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private com.fedu.fedu.entity.Test quiz;
    private TestQuestion question1;

    @BeforeEach
    void setUp() {
        
        jdbcTemplate.execute("DELETE FROM ticket_comments");
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

        Subject subject = subjectRepository.findAll().stream()
                .filter(s -> "SWP391".equals(s.getSubjectCode()))
                .findFirst()
                .orElseGet(() -> subjectRepository.save(Subject.builder()
                        .subjectCode("SWP391")
                        .subjectName("Software Development Project")
                        
                        
                        .status("draft")
                        .isDeleted(false)
                        .build()));

        LearningPath path = LearningPath.builder()
                .subject(subject)
                .pathName("SWP391 Template")
                .isDeleted(false)
                .build();
        learningPathRepository.save(path);

        LearningNode node = LearningNode.builder()
                .learningPath(path)
                .title("Introduction to Testing")
                .isRequired(true)
                .isDeleted(false)
                .build();
        learningNodeRepository.save(node);

        quiz = com.fedu.fedu.entity.Test.builder()
                .learningNode(node)
                .title("Quiz 1")
                .description("First quiz description")
                .durationMinutes(15)
                .passingPercentage(BigDecimal.valueOf(50))
                .isDeleted(false)
                .build();
        testRepository.save(quiz);

        question1 = TestQuestion.builder()
                .test(quiz)
                .questionContent("What is MockMvc?")
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .score(BigDecimal.ONE)
                .build();
        testQuestionRepository.save(question1);

        TestAnswer answer1 = TestAnswer.builder()
                .question(question1)
                .answerContent("A framework to test controllers without starting a full HTTP server")
                .isCorrect(true)
                .build();
        testAnswerRepository.save(answer1);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testGetQuestions() throws Exception {
        mockMvc.perform(get("/admin/tests/" + quiz.getTestId() + "/questions"))
                .andExpect(status().isOk())
                .andDo(result -> {
                    String json = result.getResponse().getContentAsString();
                    assertTrue(json.contains("What is MockMvc?"));
                    assertTrue(json.contains("A framework to test controllers"));
                });
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testAddQuestion() throws Exception {
        QuestionRequest request = QuestionRequest.builder()
                .questionContent("What is Spring Boot?")
                .questionType(QuestionType.MULTIPLE_CHOICE)
                .score(BigDecimal.valueOf(2.5))
                .answers(Arrays.asList(
                        AnswerRequest.builder().answerContent("An opinionated framework").isCorrect(true).build(),
                        AnswerRequest.builder().answerContent("A programming language").isCorrect(false).build()
                ))
                .build();

        mockMvc.perform(post("/admin/tests/" + quiz.getTestId() + "/questions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andDo(result -> {
                    String json = result.getResponse().getContentAsString();
                    assertTrue(json.contains("What is Spring Boot?"));
                    assertTrue(json.contains("An opinionated framework"));
                });

        List<TestQuestion> dbQuestions = testQuestionRepository.findByTestTestId(quiz.getTestId());
        assertEquals(2, dbQuestions.size());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testUpdateQuestion() throws Exception {
        QuestionRequest request = QuestionRequest.builder()
                .questionContent("Updated question content?")
                .questionType(QuestionType.TRUE_FALSE)
                .score(BigDecimal.ONE)
                .answers(Arrays.asList(
                        AnswerRequest.builder().answerContent("True").isCorrect(true).build(),
                        AnswerRequest.builder().answerContent("False").isCorrect(false).build()
                ))
                .build();

        mockMvc.perform(put("/admin/test-questions/" + question1.getQuestionId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andDo(result -> {
                    String json = result.getResponse().getContentAsString();
                    assertTrue(json.contains("Updated question content?"));
                    assertTrue(json.contains("True"));
                });

        TestQuestion updated = testQuestionRepository.findById(question1.getQuestionId()).orElse(null);
        assertNotNull(updated);
        assertEquals("Updated question content?", updated.getQuestionContent());
        assertEquals(QuestionType.TRUE_FALSE, updated.getQuestionType());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testDeleteQuestion() throws Exception {
        mockMvc.perform(delete("/admin/test-questions/" + question1.getQuestionId()))
                .andExpect(status().isOk());

        assertFalse(testQuestionRepository.findById(question1.getQuestionId()).isPresent());
    }
}

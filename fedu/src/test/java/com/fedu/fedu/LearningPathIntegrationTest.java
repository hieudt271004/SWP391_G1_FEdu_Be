package com.fedu.fedu;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.service.ClassroomEnrollmentService;
import com.fedu.fedu.service.LearningPathService;
import com.fedu.fedu.utils.enums.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class LearningPathIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ClassroomRepository classroomRepository;

    @Autowired
    private SubjectRepository subjectRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private LearningPathRepository learningPathRepository;

    @Autowired
    private LearningNodeRepository learningNodeRepository;

    @Autowired
    private StudentNodeProgressRepository studentNodeProgressRepository;

    @Autowired
    private ClassroomSubjectRepository classroomSubjectRepository;

    @Autowired
    private ClassroomSubjectStudentRepository classroomSubjectStudentRepository;

    @Autowired
    private ClassroomEnrollmentService classroomEnrollmentService;

    @SpyBean
    private LearningPathService learningPathService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private org.springframework.transaction.support.TransactionTemplate transactionTemplate;

    private Classroom classroomA;
    private Classroom classroomB;
    private ClassroomSubject classroomSubjectA;
    private ClassroomSubject classroomSubjectB;
    private UserAccount teacherA;
    private UserAccount teacherB;
    private Subject subject;
    private LearningPath templatePath;
    private LearningNode node1;
    private LearningNode node2;

    @BeforeEach
    void setUp() {
        transactionTemplate.setPropagationBehavior(org.springframework.transaction.TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        transactionTemplate.execute(status -> {
            
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
            jdbcTemplate.execute("DELETE FROM user_role");
            jdbcTemplate.execute("DELETE FROM user_account");

            
            teacherA = userAccountRepository.save(UserAccount.builder()
                    .email("teacherA@fedu.edu.vn")
                    .firstName("Teacher")
                    .lastName("A")
                    .password("password")
                    .status(UserStatus.ACTIVE)
                    .build());
            Role teacherRole = roleRepository.findByRoleName(com.fedu.fedu.utils.enums.UserRole.TEACHER).orElseThrow();
            UserRole userRoleA = userRoleRepository.save(UserRole.builder()
                    .userAccount(teacherA)
                    .role(teacherRole)
                    .build());
            teacherA.setUserRoles(java.util.Collections.singletonList(userRoleA));

            
            teacherB = userAccountRepository.save(UserAccount.builder()
                    .email("teacherB@fedu.edu.vn")
                    .firstName("Teacher")
                    .lastName("B")
                    .password("password")
                    .status(UserStatus.ACTIVE)
                    .build());
            UserRole userRoleB = userRoleRepository.save(UserRole.builder()
                    .userAccount(teacherB)
                    .role(teacherRole)
                    .build());
            teacherB.setUserRoles(java.util.Collections.singletonList(userRoleB));

            
            subject = subjectRepository.save(Subject.builder()
                    .subjectCode("PRJ301")
                    .subjectName("Java Web")
                    .status("published")
                    .isDeleted(false)
                    .build());

            
            classroomA = classroomRepository.save(Classroom.builder()
                    .className("Class A")
                    .status(com.fedu.fedu.utils.enums.ClassroomStatus.ACTIVE)
                    .isDeleted(false)
                    .build());


            classroomB = classroomRepository.save(Classroom.builder()
                    .className("Class B")
                    .status(com.fedu.fedu.utils.enums.ClassroomStatus.ACTIVE)
                    .isDeleted(false)
                    .build());

            
            classroomSubjectA = classroomSubjectRepository.save(ClassroomSubject.builder()
                    .classroom(classroomA)
                    .subject(subject)
                    .lecturer(teacherA)
                    .build());

            
            classroomSubjectB = classroomSubjectRepository.save(ClassroomSubject.builder()
                    .classroom(classroomB)
                    .subject(subject)
                    .lecturer(teacherB)
                    .build());

            
            templatePath = learningPathRepository.save(LearningPath.builder()
                    .subject(subject)
                    .pathName("Template Roadmap")
                    .description("PRJ301 Template")
                    .isDeleted(false)
                    .build());

            
            node1 = learningNodeRepository.save(LearningNode.builder()
                    .learningPath(templatePath)
                    .title("Introduction")
                    .displayOrder(1)
                    .isRequired(true)
                    .isDeleted(false)
                    .build());

            node2 = learningNodeRepository.save(LearningNode.builder()
                    .learningPath(templatePath)
                    .title("Advanced Basics")
                    .displayOrder(2)
                    .isRequired(true)
                    .isDeleted(false)
                    .build());
            return null;
        });
    }

    @Test
    @WithMockUser(username = "teacherA@fedu.edu.vn", roles = {"TEACHER"})
    void testEndToEndLearningPathFlow() throws Exception {
        
        List<LearningPath> clonedPaths = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectA.getId());
        assertTrue(clonedPaths.isEmpty());

        learningPathService.cloneLearningPath(classroomSubjectA.getId(), templatePath.getPathId());

        clonedPaths = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectA.getId());
        assertEquals(1, clonedPaths.size());

        LearningPath clonedPath = clonedPaths.get(0);
        assertNotNull(clonedPath);
        assertEquals(classroomSubjectA.getId(), clonedPath.getClassroomSubject().getId());

        
        UserAccount student = UserAccount.builder()
                .email("student1@fedu.edu.vn")
                .firstName("Student")
                .lastName("One")
                .password("password")
                .status(UserStatus.ACTIVE)
                .build();
        userAccountRepository.save(student);
        Role studentRole = roleRepository.findByRoleName(com.fedu.fedu.utils.enums.UserRole.STUDENT).orElseThrow();
        UserRole userRole1 = userRoleRepository.save(UserRole.builder()
                .userAccount(student)
                .role(studentRole)
                .build());
        student.setUserRoles(java.util.Collections.singletonList(userRole1));

        ClassroomSubjectStudent enrollment = ClassroomSubjectStudent.builder()
                .classroomSubject(classroomSubjectA)
                .student(student)
                .currentLevel(2)
                .build();
        classroomSubjectStudentRepository.save(enrollment);

        
        learningPathService.publishClassroomPath(classroomSubjectA.getId(), clonedPath.getPathId());

        
        long snpCount = studentNodeProgressRepository.count();
        assertEquals(2, snpCount); 

        
        UserAccount student2 = UserAccount.builder()
                .email("student2@fedu.edu.vn")
                .firstName("Student")
                .lastName("Two")
                .password("password")
                .status(UserStatus.ACTIVE)
                .build();
        userAccountRepository.save(student2);
        UserRole userRole2 = userRoleRepository.save(UserRole.builder()
                .userAccount(student2)
                .role(studentRole)
                .build());
        student2.setUserRoles(java.util.Collections.singletonList(userRole2));

        AddStudentRequest addRequest = new AddStudentRequest();
        addRequest.setEmail("student2@fedu.edu.vn");

        classroomEnrollmentService.enrollStudent(classroomSubjectA.getId(), addRequest);

        
        ClassroomSubjectStudent css2 = classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(classroomSubjectA.getId(), student2.getUserId())
                .orElseThrow();
        css2.setCurrentLevel(2);
        classroomSubjectStudentRepository.save(css2);

        
        learningPathService.backfillProgressForStudent(classroomSubjectA.getId(), student2.getUserId());

        
        List<StudentNodeProgress> student2Progress = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(student2.getUserId(), clonedPath.getPathId());
        assertEquals(2, student2Progress.size());
    }

    
    @Test
    @WithMockUser(username = "teacherA@fedu.edu.vn", roles = {"TEACHER"})
    void testConcurrentPublishRace() throws Exception {
        transactionTemplate.execute(status -> {
            learningPathService.cloneLearningPath(classroomSubjectA.getId(), templatePath.getPathId());
            return null;
        });
        LearningPath clonedPath = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectA.getId())
                .get(0);

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
                    
                    org.springframework.security.core.context.SecurityContext context = org.springframework.security.core.context.SecurityContextHolder.createEmptyContext();
                    context.setAuthentication(new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                            "teacherA@fedu.edu.vn", "password",
                            java.util.List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_TEACHER"))
                    ));
                    org.springframework.security.core.context.SecurityContextHolder.setContext(context);

                    learningPathService.publishClassroomPath(classroomSubjectA.getId(), clonedPath.getPathId());
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    e.printStackTrace();
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
    @WithMockUser(username = "teacherA@fedu.edu.vn", roles = {"TEACHER"})
    void testAuthorizationForTeacherClassrooms() throws Exception {
        
        mockMvc.perform(get("/teacher-manage/classroom-subjects/{classroomSubjectId}/graph", classroomSubjectA.getId()))
                .andExpect(status().isOk());

        
        mockMvc.perform(get("/teacher-manage/classroom-subjects/{classroomSubjectId}/graph", classroomSubjectB.getId()))
                .andExpect(status().isForbidden());
    }

    
    @Test
    @WithMockUser(username = "teacherA@fedu.edu.vn", roles = {"TEACHER"})
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.NOT_SUPPORTED)
    void testRollbackEnrollmentWhenBackfillFails() {
        learningPathService.cloneLearningPath(classroomSubjectA.getId(), templatePath.getPathId());
        LearningPath clonedPath = learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(classroomSubjectA.getId())
                .get(0);
        learningPathService.publishClassroomPath(classroomSubjectA.getId(), clonedPath.getPathId());

        UserAccount student = UserAccount.builder()
                .email("studentRollback@fedu.edu.vn")
                .firstName("Student")
                .lastName("Rollback")
                .password("password")
                .status(UserStatus.ACTIVE)
                .build();
        userAccountRepository.save(student);
        Role studentRole = roleRepository.findByRoleName(com.fedu.fedu.utils.enums.UserRole.STUDENT).orElseThrow();
        UserRole userRole = userRoleRepository.save(UserRole.builder()
                .userAccount(student)
                .role(studentRole)
                .build());
        student.setUserRoles(java.util.Collections.singletonList(userRole));

        AddStudentRequest request = new AddStudentRequest();
        request.setEmail("studentRollback@fedu.edu.vn");

        
        doThrow(new RuntimeException("Simulated backfill failure"))
                .when(learningPathService).backfillProgressForStudent(eq(classroomSubjectA.getId()), anyLong());

        assertThrows(RuntimeException.class, () -> {
            classroomEnrollmentService.enrollStudent(classroomSubjectA.getId(), request);
        });

        
        boolean enrolled = classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(classroomSubjectA.getId(), student.getUserId()).isPresent();
        assertFalse(enrolled);
    }
}

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

    private Classroom classroomA;
    private Classroom classroomB;
    private UserAccount teacherA;
    private UserAccount teacherB;
    private Subject subject;
    private LearningPath templatePath;
    private LearningNode node1;
    private LearningNode node2;

    @BeforeEach
    void setUp() {
        // Create teacher A
        teacherA = UserAccount.builder()
                .email("teacherA@fedu.edu.vn")
                .firstName("Teacher")
                .lastName("A")
                .password("password")
                .status(UserStatus.ACTIVE)
                .build();
        userAccountRepository.save(teacherA);

        // Create teacher B
        teacherB = UserAccount.builder()
                .email("teacherB@fedu.edu.vn")
                .firstName("Teacher")
                .lastName("B")
                .password("password")
                .status(UserStatus.ACTIVE)
                .build();
        userAccountRepository.save(teacherB);

        // Create subject
        subject = Subject.builder()
                .subjectCode("PRJ301")
                .subjectName("Java Web")
                .isDeleted(false)
                .build();
        subjectRepository.save(subject);

        // Create classroom A owned by teacher A
        classroomA = Classroom.builder()
                .className("Class A")
                .lecturer(teacherA)
                .subject(subject)
                .status("active")
                .isDeleted(false)
                .build();
        classroomRepository.save(classroomA);

        // Create classroom B owned by teacher B
        classroomB = Classroom.builder()
                .className("Class B")
                .lecturer(teacherB)
                .subject(subject)
                .status("active")
                .isDeleted(false)
                .build();
        classroomRepository.save(classroomB);

        // Create classroom subject for Class A
        ClassroomSubject classroomSubject = ClassroomSubject.builder()
                .classroom(classroomA)
                .subject(subject)
                .lecturer(teacherA)
                .build();
        classroomSubjectRepository.save(classroomSubject);

        // Create template learning path
        templatePath = LearningPath.builder()
                .subject(subject)
                .pathName("Template Roadmap")
                .description("PRJ301 Template")
                .isDeleted(false)
                .build();
        learningPathRepository.save(templatePath);

        // Create nodes
        node1 = LearningNode.builder()
                .learningPath(templatePath)
                .title("Introduction")
                .displayOrder(1)
                .isRequired(true)
                .isDeleted(false)
                .build();
        learningNodeRepository.save(node1);

        node2 = LearningNode.builder()
                .learningPath(templatePath)
                .title("Advanced Basics")
                .displayOrder(2)
                .isRequired(true)
                .isDeleted(false)
                .build();
        learningNodeRepository.save(node2);
    }

    // 6.7 Integration test end-to-end: clone template -> publish -> assert SNP count = students x nodes; thêm student mới -> assert SNP backfilled chỉ cho student đó
    @Test
    @WithMockUser(username = "teacherA@fedu.edu.vn", roles = {"TEACHER"})
    void testEndToEndLearningPathFlow() throws Exception {
        // 1. Clone template
        LearningPath clonedPath = learningPathRepository.findByClassroomClassroomIdAndIsDeletedFalse(classroomA.getClassroomId())
                .orElse(null);
        assertNull(clonedPath);

        learningPathService.cloneLearningPath(classroomA.getClassroomId(), templatePath.getPathId());

        clonedPath = learningPathRepository.findByClassroomClassroomIdAndIsDeletedFalse(classroomA.getClassroomId())
                .orElse(null);
        assertNotNull(clonedPath);
        assertEquals(classroomA.getClassroomId(), clonedPath.getClassroom().getClassroomId());

        // Create enrolled student
        UserAccount student = UserAccount.builder()
                .email("student1@fedu.edu.vn")
                .firstName("Student")
                .lastName("One")
                .password("password")
                .status(UserStatus.ACTIVE)
                .build();
        userAccountRepository.save(student);

        ClassroomSubject classroomSubject = classroomSubjectRepository.findByClassroomClassroomId(classroomA.getClassroomId())
                .stream().findFirst().orElseThrow();
        ClassroomSubjectStudent enrollment = ClassroomSubjectStudent.builder()
                .classroomSubject(classroomSubject)
                .student(student)
                .build();
        classroomSubjectStudentRepository.save(enrollment);

        // 2. Publish
        learningPathService.publishClassroomPath(classroomA.getClassroomId(), clonedPath.getPathId());

        // Check SNP count
        long snpCount = studentNodeProgressRepository.count();
        assertEquals(2, snpCount); // 1 student * 2 nodes = 2 SNP

        // 3. Enroll late student using ClassroomEnrollmentService
        UserAccount student2 = UserAccount.builder()
                .email("student2@fedu.edu.vn")
                .firstName("Student")
                .lastName("Two")
                .password("password")
                .status(UserStatus.ACTIVE)
                .build();
        userAccountRepository.save(student2);

        AddStudentRequest addRequest = new AddStudentRequest();
        addRequest.setEmail("student2@fedu.edu.vn");

        classroomEnrollmentService.enrollStudent(classroomA.getClassroomId(), addRequest);

        // Check SNP backfilled only for student 2
        List<StudentNodeProgress> student2Progress = studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(student2.getUserId(), clonedPath.getPathId());
        assertEquals(2, student2Progress.size());
    }

    // 6.8 Concurrent test publish race (2 threads, một thắng một 409)
    @Test
    @WithMockUser(username = "teacherA@fedu.edu.vn", roles = {"TEACHER"})
    void testConcurrentPublishRace() throws Exception {
        learningPathService.cloneLearningPath(classroomA.getClassroomId(), templatePath.getPathId());
        LearningPath clonedPath = learningPathRepository.findByClassroomClassroomIdAndIsDeletedFalse(classroomA.getClassroomId()).orElseThrow();

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
                    learningPathService.publishClassroomPath(classroomA.getClassroomId(), clonedPath.getPathId());
                    successCount.incrementAndGet();
                } catch (Exception e) {
                    failureCount.incrementAndGet();
                } finally {
                    finishLatch.countDown();
                }
            });
        }

        latch.countDown(); // trigger concurrent run
        finishLatch.await();
        executor.shutdown();

        assertEquals(1, successCount.get());
        assertEquals(1, failureCount.get());
    }

    // 6.9 Authorization test (Eng H6): teacher A (không phải lecturer của classroom B) gọi mọi endpoint trên classroom B -> 403; teacher A gọi trên classroom A -> 200
    @Test
    @WithMockUser(username = "teacherA@fedu.edu.vn", roles = {"TEACHER"})
    void testAuthorizationForTeacherClassrooms() throws Exception {
        // Teacher A calls GET classroom A graph -> 200
        mockMvc.perform(get("/teacher-manage/classrooms/{classroomId}/graph", classroomA.getClassroomId()))
                .andExpect(status().isOk());

        // Teacher A calls GET classroom B graph -> 403 Access Denied
        mockMvc.perform(get("/teacher-manage/classrooms/{classroomId}/graph", classroomB.getClassroomId()))
                .andExpect(status().isForbidden());
    }

    // 6.10 Test rollback enrollment khi backfill fail
    @Test
    @WithMockUser(username = "teacherA@fedu.edu.vn", roles = {"TEACHER"})
    void testRollbackEnrollmentWhenBackfillFails() {
        learningPathService.cloneLearningPath(classroomA.getClassroomId(), templatePath.getPathId());
        LearningPath clonedPath = learningPathRepository.findByClassroomClassroomIdAndIsDeletedFalse(classroomA.getClassroomId()).orElseThrow();
        learningPathService.publishClassroomPath(classroomA.getClassroomId(), clonedPath.getPathId());

        UserAccount student = UserAccount.builder()
                .email("studentRollback@fedu.edu.vn")
                .firstName("Student")
                .lastName("Rollback")
                .password("password")
                .status(UserStatus.ACTIVE)
                .build();
        userAccountRepository.save(student);

        AddStudentRequest request = new AddStudentRequest();
        request.setEmail("studentRollback@fedu.edu.vn");

        // Spy on service and throw error on backfill progress call
        doThrow(new RuntimeException("Simulated backfill failure"))
                .when(learningPathService).backfillProgressForStudent(eq(classroomA.getClassroomId()), anyLong());

        assertThrows(RuntimeException.class, () -> {
            classroomEnrollmentService.enrollStudent(classroomA.getClassroomId(), request);
        });

        // Verify that classroom_subject_students row does not exist (rolled back)
        ClassroomSubject classroomSubject = classroomSubjectRepository.findByClassroomClassroomId(classroomA.getClassroomId())
                .stream().findFirst().orElseThrow();
        boolean enrolled = classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(classroomSubject.getId(), student.getUserId()).isPresent();
        assertFalse(enrolled);
    }
}

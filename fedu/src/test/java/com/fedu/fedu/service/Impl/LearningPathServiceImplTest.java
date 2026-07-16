package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.repository.*;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LearningPathServiceImplTest {

    @Mock
    private LearningPathRepository learningPathRepository;
    @Mock
    private LearningNodeRepository learningNodeRepository;
    @Mock
    private SubjectRepository subjectRepository;
    @Mock
    private ClassroomSubjectRepository classroomSubjectRepository;
    @Mock
    private NodeEdgeRepository nodeEdgeRepository;
    @Mock
    private StudentNodeProgressRepository studentNodeProgressRepository;
    @Mock
    private ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    @Mock
    private UserAccountRepository userAccountRepository;
    @Mock
    private NodeMaterialRepository nodeMaterialRepository;
    @Mock
    private VideoRepository videoRepository;
    @Mock
    private FileEntityRepository fileEntityRepository;
    @Mock
    private TestRepository testRepository;
    @Mock
    private TestQuestionRepository testQuestionRepository;
    @Mock
    private TestAnswerRepository testAnswerRepository;
    @Mock
    private NodeExerciseRepository nodeExerciseRepository;

    
    @Spy
    @InjectMocks
    private TemplateEditGuard templateEditGuard;

    @InjectMocks
    private LearningPathServiceImpl learningPathService;

    private Classroom classroom;
    private UserAccount lecturer;
    private Subject subject;
    private ClassroomSubject classroomSubject;
    private LearningPath templatePath;

    @BeforeEach
    void setUp() {
        lecturer = new UserAccount();
        lecturer.setUserId(1L);
        lecturer.setEmail("teacher@fedu.edu.vn");

        subject = new Subject();
        subject.setSubjectId(10L);
        subject.setStatus("published");

        classroom = new Classroom();
        classroom.setClassroomId(100L);

        classroomSubject = new ClassroomSubject();
        classroomSubject.setId(100L);
        classroomSubject.setClassroom(classroom);
        classroomSubject.setSubject(subject);
        classroomSubject.setLecturer(lecturer);

        templatePath = new LearningPath();
        templatePath.setPathId(200L);
        templatePath.setSubject(subject);
        templatePath.setPathName("Template Path");
        templatePath.setDescription("Description");
    }

    private void mockAuthentication(String email, String role) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(email);
        lenient().when(auth.getAuthorities()).thenAnswer(invocation -> 
            Collections.singletonList(new SimpleGrantedAuthority(role))
        );
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(securityContext);
    }

    private void clearAuthentication() {
        SecurityContextHolder.clearContext();
    }

    
    @Test
    void testCloneLearningPath_Success() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");

        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);
        when(classroomSubjectRepository.findById(100L)).thenReturn(Optional.of(classroomSubject));
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.emptyList());

        LearningPath template = LearningPath.builder().pathId(202L).subject(subject).isDeleted(false).build();
        when(learningPathRepository.findById(202L)).thenReturn(Optional.of(template));

        LearningNode node1 = LearningNode.builder().nodeId(1L).title("Node 1").displayOrder(1).isRequired(true).build();
        LearningNode node2 = LearningNode.builder().nodeId(2L).title("Node 2").displayOrder(2).isRequired(false).build();
        when(learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(202L)).thenReturn(Arrays.asList(node1, node2));

        NodeEdge edge = NodeEdge.builder().edgeId(5L).fromNode(node1).toNode(node2).build();
        when(nodeEdgeRepository.findByFromNodeLearningPathPathId(202L)).thenReturn(Collections.singletonList(edge));

        when(learningPathRepository.save(any(LearningPath.class))).thenAnswer(inv -> inv.getArgument(0));

        LearningPathResponse response = learningPathService.cloneLearningPath(100L, 202L);

        assertNotNull(response);

        verify(learningNodeRepository, times(2)).save(any(LearningNode.class));
        verify(nodeEdgeRepository, times(1)).save(any(NodeEdge.class));
        clearAuthentication();
    }

    @Test
    void testCloneLearningPath_Conflict_AlreadyExists() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");
        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);
        when(classroomSubjectRepository.findById(100L)).thenReturn(Optional.of(classroomSubject));
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.singletonList(new LearningPath()));

        assertThrows(InvalidDataException.class, () -> {
            learningPathService.cloneLearningPath(100L, 202L);
        });
        clearAuthentication();
    }

    
    @Test
    void testCloneLearningPath_CycleDetected() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");
        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);
        when(classroomSubjectRepository.findById(100L)).thenReturn(Optional.of(classroomSubject));
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.emptyList());

        LearningPath template = LearningPath.builder().pathId(202L).subject(subject).isDeleted(false).build();
        when(learningPathRepository.findById(202L)).thenReturn(Optional.of(template));

        LearningNode node1 = LearningNode.builder().nodeId(1L).title("Node 1").build();
        LearningNode node2 = LearningNode.builder().nodeId(2L).title("Node 2").build();
        when(learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(202L)).thenReturn(Arrays.asList(node1, node2));

        
        NodeEdge edge1 = NodeEdge.builder().fromNode(node1).toNode(node2).build();
        NodeEdge edge2 = NodeEdge.builder().fromNode(node2).toNode(node1).build();
        when(nodeEdgeRepository.findByFromNodeLearningPathPathId(202L)).thenReturn(Arrays.asList(edge1, edge2));

        IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
            learningPathService.cloneLearningPath(100L, 202L);
        });
        assertEquals("Template chứa cycle", exception.getMessage());
        clearAuthentication();
    }

    
    @Test
    void testGetClassroomGraph_NoPath() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");
        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);
        when(classroomSubjectRepository.findById(100L)).thenReturn(Optional.of(classroomSubject));
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.emptyList());

        LearningPath template = new LearningPath();
        template.setPathId(200L);
        template.setPathName("Template 1");
        template.setDescription("Desc");
        when(learningPathRepository.findBySubjectSubjectIdAndClassroomSubjectIsNullAndIsDeletedFalse(10L))
                .thenReturn(Collections.singletonList(template));

        when(learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(200L))
                .thenReturn(Arrays.asList(new LearningNode(), new LearningNode()));

        ClassroomGraphResponse response = learningPathService.getClassroomGraph(100L);

        assertNotNull(response);
        assertEquals("NO_PATH", response.getState());
        assertEquals(1, response.getAvailableTemplates().size());
        assertEquals(2, response.getAvailableTemplates().get(0).getNodeCount());
        clearAuthentication();
    }

    @Test
    void testGetClassroomGraph_Draft() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");
        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);
        when(classroomSubjectRepository.findById(100L)).thenReturn(Optional.of(classroomSubject));

        LearningPath draftPath = new LearningPath();
        draftPath.setPathId(300L);
        draftPath.setClassroomSubject(classroomSubject);
        draftPath.setPublishedAt(null);
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.singletonList(draftPath));

        ClassroomGraphResponse response = learningPathService.getClassroomGraph(100L);

        assertNotNull(response);
        assertEquals("DRAFT", response.getState());
        assertNotNull(response.getAvailableTemplates());
        java.util.List<?> templates = response.getAvailableTemplates();
        java.util.Objects.requireNonNull(templates);
        org.junit.jupiter.api.Assertions.assertTrue(templates.isEmpty());
        clearAuthentication();
    }

    
    @Test
    void testPublishClassroomPath_Success() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");
        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);

        com.fedu.fedu.entity.Test quiz = new com.fedu.fedu.entity.Test();
        quiz.setTestId(999L);
        classroomSubject.setQuizStart(quiz);
        when(classroomSubjectRepository.findById(100L)).thenReturn(Optional.of(classroomSubject));

        LearningPath path = new LearningPath();
        path.setPathId(300L);
        path.setClassroomSubject(classroomSubject);
        path.setPublishedAt(null);
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.singletonList(path));
        when(learningPathRepository.findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(100L))
                .thenReturn(Optional.of(path));

        LearningNode node1 = LearningNode.builder().nodeId(1L).title("Node 1").displayOrder(0).build();
        LearningNode node2 = LearningNode.builder().nodeId(2L).title("Node 2").displayOrder(1).build();
        when(learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(300L))
                .thenReturn(Arrays.asList(node1, node2));

        NodeEdge edge = NodeEdge.builder().fromNode(node1).toNode(node2).build();
        when(nodeEdgeRepository.findByFromNodeLearningPathPathId(300L))
                .thenReturn(Collections.singletonList(edge));

        UserAccount student1 = new UserAccount();
        student1.setUserId(10L);
        UserAccount student2 = new UserAccount();
        student2.setUserId(11L);
        when(classroomSubjectStudentRepository.findDistinctStudentsByClassroomSubjectId(100L))
                .thenReturn(Arrays.asList(student1, student2));

        ClassroomSubjectStudent css1 = ClassroomSubjectStudent.builder().classroomSubject(classroomSubject).student(student1).currentLevel(2).build();
        ClassroomSubjectStudent css2 = ClassroomSubjectStudent.builder().classroomSubject(classroomSubject).student(student2).currentLevel(2).build();
        when(classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(100L, 10L)).thenReturn(Optional.of(css1));
        when(classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(100L, 11L)).thenReturn(Optional.of(css2));
        when(studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(anyLong(), eq(300L)))
                .thenReturn(Collections.emptyList());

        PublishResultResponse response = learningPathService.publishClassroomPath(100L, 300L);

        assertNotNull(response);
        assertEquals(2, response.getSeededStudents());
        assertNotNull(path.getPublishedAt());
        assertEquals(lecturer, path.getPublishedBy());

        verify(studentNodeProgressRepository, times(2)).saveAll(anyList());
        clearAuthentication();
    }

    @Test
    void testPublishClassroomPath_BlocksStuckLevel() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");
        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);

        com.fedu.fedu.entity.Test quiz = new com.fedu.fedu.entity.Test();
        quiz.setTestId(999L);
        classroomSubject.setQuizStart(quiz);
        when(classroomSubjectRepository.findById(100L)).thenReturn(Optional.of(classroomSubject));

        LearningPath path = new LearningPath();
        path.setPathId(300L);
        path.setClassroomSubject(classroomSubject);
        path.setPublishedAt(null);
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.singletonList(path));

        LearningNode shared = LearningNode.builder().nodeId(1L).title("Giới thiệu").displayOrder(0).build();
        LearningNode lvl1 = LearningNode.builder().nodeId(2L).title("Bài mức Yếu").level(1).displayOrder(1).build();
        LearningNode lvl3 = LearningNode.builder().nodeId(3L).title("Bài mức Khá").level(3).displayOrder(2).build();
        when(learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(300L))
                .thenReturn(Arrays.asList(shared, lvl1, lvl3));

        NodeEdge e1 = NodeEdge.builder().fromNode(shared).toNode(lvl1).build();
        NodeEdge e2 = NodeEdge.builder().fromNode(shared).toNode(lvl3).build();
        when(nodeEdgeRepository.findByFromNodeLearningPathPathId(300L))
                .thenReturn(Arrays.asList(e1, e2));

        assertThrows(InvalidDataException.class,
                () -> learningPathService.publishClassroomPath(100L, 300L));
        clearAuthentication();
    }

    
    @Test
    void testUnpublishClassroomPath_Success() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");
        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);
        
        LearningPath path = new LearningPath();
        path.setPathId(300L);
        path.setClassroomSubject(classroomSubject);
        path.setPublishedAt(LocalDateTime.now());
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.singletonList(path));

        when(studentNodeProgressRepository.existsByLearningPathPathIdAndStatus(300L, StudentProgressStatus.COMPLETED))
                .thenReturn(false);

        learningPathService.unpublishClassroomPath(100L, 300L);

        assertNull(path.getPublishedAt());
        assertNull(path.getPublishedBy());
        verify(studentNodeProgressRepository, times(1)).deleteAllByLearningPathPathId(300L);
        clearAuthentication();
    }

    @Test
    void testUnpublishClassroomPath_Forbidden_HasCompleted() {
        mockAuthentication("teacher@fedu.edu.vn", "ROLE_TEACHER");
        when(userAccountRepository.findByEmail("teacher@fedu.edu.vn")).thenReturn(Optional.of(lecturer));
        when(classroomSubjectRepository.existsByIdAndLecturerUserId(100L, 1L)).thenReturn(true);
        
        LearningPath path = new LearningPath();
        path.setPathId(300L);
        path.setClassroomSubject(classroomSubject);
        path.setPublishedAt(LocalDateTime.now());
        when(learningPathRepository.findAllByClassroomSubjectIdAndIsDeletedFalse(100L))
                .thenReturn(Collections.singletonList(path));

        when(studentNodeProgressRepository.existsByLearningPathPathIdAndStatus(300L, StudentProgressStatus.COMPLETED))
                .thenReturn(true);

        assertThrows(InvalidDataException.class, () -> {
            learningPathService.unpublishClassroomPath(100L, 300L);
        });
        clearAuthentication();
    }

    
    @Test
    void testBackfillProgressForStudent_Success() {
        LearningPath path = new LearningPath();
        path.setPathId(300L);
        path.setClassroomSubject(classroomSubject);
        path.setPublishedAt(LocalDateTime.now());

        ClassroomSubjectStudent css = ClassroomSubjectStudent.builder()
                .classroomSubject(classroomSubject)
                .student(new UserAccount())
                .currentLevel(2)
                .build();
        when(classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(100L, 10L))
                .thenReturn(Optional.of(css));
        when(learningPathRepository.findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(100L))
                .thenReturn(Optional.of(path));

        when(studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(10L, 300L))
                .thenReturn(Collections.emptyList());

        LearningNode node = LearningNode.builder().nodeId(1L).title("Node 1").displayOrder(0).build();
        when(learningNodeRepository.findByLearningPathPathIdAndIsDeletedFalse(300L))
                .thenReturn(Collections.singletonList(node));

        learningPathService.backfillProgressForStudent(100L, 10L);

        verify(studentNodeProgressRepository, times(1)).saveAll(anyList());
    }
}

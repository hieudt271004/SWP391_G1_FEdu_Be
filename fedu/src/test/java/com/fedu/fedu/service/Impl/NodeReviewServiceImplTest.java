package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateNodeReviewRequest;
import com.fedu.fedu.dto.res.NodeReviewResponse;
import com.fedu.fedu.dto.res.NodeReviewSummaryResponse;
import com.fedu.fedu.entity.*;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NodeReviewServiceImplTest {

    @Mock
    private NodeReviewRepository nodeReviewRepository;
    @Mock
    private LearningNodeRepository learningNodeRepository;
    @Mock
    private ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    @Mock
    private UserAccountRepository userAccountRepository;
    @Mock
    private StudentNodeProgressRepository studentNodeProgressRepository;

    @InjectMocks
    private NodeReviewServiceImpl nodeReviewService;

    private UserAccount studentUser;
    private UserAccount teacherUser;
    private UserAccount outsiderUser;
    private LearningNode learningNode;
    private LearningPath learningPath;
    private ClassroomSubject classroomSubject;

    @BeforeEach
    void setUp() {
        studentUser = new UserAccount();
        studentUser.setUserId(100L);
        studentUser.setEmail("student@fedu.edu.vn");

        teacherUser = new UserAccount();
        teacherUser.setUserId(200L);
        teacherUser.setEmail("teacher@fedu.edu.vn");

        outsiderUser = new UserAccount();
        outsiderUser.setUserId(999L);
        outsiderUser.setEmail("outsider@fedu.edu.vn");

        classroomSubject = new ClassroomSubject();
        classroomSubject.setId(300L);
        classroomSubject.setLecturer(teacherUser);

        learningPath = new LearningPath();
        learningPath.setPathId(400L);
        learningPath.setClassroomSubject(classroomSubject);

        learningNode = new LearningNode();
        learningNode.setNodeId(500L);
        learningNode.setLearningPath(learningPath);
    }

    @Test
    void testCommentMidCourseAllowed() {
        // Enrolled student can comment without course completion gate
        when(learningNodeRepository.findById(500L)).thenReturn(Optional.of(learningNode));
        when(classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(300L, 100L)).thenReturn(true);
        when(userAccountRepository.findById(100L)).thenReturn(Optional.of(studentUser));

        CreateNodeReviewRequest request = CreateNodeReviewRequest.builder()
                .content("Good comment")
                .build();

        NodeReviewResponse response = nodeReviewService.createComment(500L, 100L, request);

        assertNotNull(response);
        assertNull(response.getRating());
        assertEquals("Good comment", response.getContent());
        verify(nodeReviewRepository, times(1)).save(any(NodeReview.class));
    }

    @Test
    void testReviewMidCourseRejected() {
        // Student can't submit rated review if not finished the path
        when(learningNodeRepository.findById(500L)).thenReturn(Optional.of(learningNode));
        when(classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(300L, 100L)).thenReturn(true);
        
        // Mock not completed
        when(studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(100L, 400L)).thenReturn(Collections.emptyList());

        CreateNodeReviewRequest request = CreateNodeReviewRequest.builder()
                .rating(5)
                .content("Great course")
                .build();

        assertThrows(InvalidDataException.class, () -> {
            nodeReviewService.submitReview(500L, 100L, request);
        });
    }

    @Test
    void testOutsiderDenied() {
        // Outsider who is not student and not lecturer is denied
        when(learningNodeRepository.findById(500L)).thenReturn(Optional.of(learningNode));
        when(classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(300L, 999L)).thenReturn(false);

        CreateNodeReviewRequest request = CreateNodeReviewRequest.builder()
                .content("Outsider comment")
                .build();

        assertThrows(AccessDeniedException.class, () -> {
            nodeReviewService.createComment(500L, 999L, request);
        });
    }

    @Test
    void testTeacherCommentAllowed() {
        // Lecturer can comment
        when(learningNodeRepository.findById(500L)).thenReturn(Optional.of(learningNode));
        when(classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(300L, 200L)).thenReturn(false);
        when(userAccountRepository.findById(200L)).thenReturn(Optional.of(teacherUser));

        CreateNodeReviewRequest request = CreateNodeReviewRequest.builder()
                .content("Teacher feedback")
                .build();

        NodeReviewResponse response = nodeReviewService.createComment(500L, 200L, request);

        assertNotNull(response);
        verify(nodeReviewRepository, times(1)).save(any(NodeReview.class));
    }

    @Test
    void testReplyToReplyRejected() {
        // Enrolled student/teacher can't reply to a reply
        when(learningNodeRepository.findById(500L)).thenReturn(Optional.of(learningNode));
        when(classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(300L, 100L)).thenReturn(true);

        NodeReview grandParent = new NodeReview();
        grandParent.setReviewId(600L);

        NodeReview parentReply = new NodeReview();
        parentReply.setReviewId(700L);
        parentReply.setLearningNode(learningNode);
        parentReply.setParentReview(grandParent);

        when(nodeReviewRepository.findById(700L)).thenReturn(Optional.of(parentReply));

        CreateNodeReviewRequest request = CreateNodeReviewRequest.builder()
                .content("Nested reply")
                .build();

        assertThrows(InvalidDataException.class, () -> {
            nodeReviewService.replyToReview(500L, 700L, 100L, request);
        });
    }

    @Test
    void testAuthorScopedDeleteWithLargeIds() {
        // Author check uses .equals() (Long objects > 127)
        Long largeAuthorId = 2000L;
        UserAccount author = new UserAccount();
        author.setUserId(largeAuthorId);

        NodeReview reply = new NodeReview();
        reply.setReviewId(800L);
        reply.setAuthor(author);
        reply.setParentReview(new NodeReview()); // make it a reply

        when(nodeReviewRepository.findById(800L)).thenReturn(Optional.of(reply));

        // Delete with matching Long value (2000L) but distinct objects
        Long sameIdObj = Long.valueOf("2000");
        
        nodeReviewService.deleteReply(800L, sameIdObj);

        assertTrue(reply.getIsDeleted());
        verify(nodeReviewRepository, times(1)).save(reply);
    }

    @Test
    void testSummarySplitAndAverageIgnoresComments() {
        // Roots are split into reviews and comments, average ignores comments
        NodeReview review1 = new NodeReview();
        review1.setReviewId(10L);
        review1.setRating(5);
        review1.setLearningNode(learningNode);

        NodeReview comment1 = new NodeReview();
        comment1.setReviewId(20L);
        comment1.setRating(null); // comment
        comment1.setLearningNode(learningNode);

        when(learningNodeRepository.findById(500L)).thenReturn(Optional.of(learningNode));
        when(classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(300L, 100L)).thenReturn(true);
        when(nodeReviewRepository.findByLearningNodeNodeIdAndParentReviewIsNullAndIsDeletedFalseOrderByCreatedAtDesc(500L))
                .thenReturn(Arrays.asList(review1, comment1));
        when(nodeReviewRepository.findByLearningNodeNodeIdAndParentReviewIsNotNullAndIsDeletedFalseOrderByCreatedAtAsc(500L))
                .thenReturn(Collections.emptyList());
        when(nodeReviewRepository.averageRatingByNode(500L)).thenReturn(5.0);

        NodeReviewSummaryResponse summary = nodeReviewService.getReviewsForStudent(500L, 100L);

        assertNotNull(summary);
        assertEquals(1, summary.getReviews().size());
        assertEquals(10L, summary.getReviews().get(0).getReviewId());
        assertEquals(1, summary.getComments().size());
        assertEquals(20L, summary.getComments().get(0).getReviewId());
        assertEquals(5.0, summary.getAverageRating());
    }
}

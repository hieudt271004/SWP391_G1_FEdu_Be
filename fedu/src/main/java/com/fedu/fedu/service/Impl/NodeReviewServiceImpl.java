package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.CreateNodeReviewRequest;
import com.fedu.fedu.dto.res.NodeReviewResponse;
import com.fedu.fedu.dto.res.NodeReviewSummaryResponse;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.NodeReview;
import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.LearningNodeRepository;
import com.fedu.fedu.repository.NodeReviewRepository;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.NodeReviewService;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NodeReviewServiceImpl implements NodeReviewService {

    private final NodeReviewRepository nodeReviewRepository;
    private final LearningNodeRepository learningNodeRepository;
    private final ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    private final UserAccountRepository userAccountRepository;
    private final StudentNodeProgressRepository studentNodeProgressRepository;

    // ===================== Học sinh =====================

    @Override
    @Transactional(readOnly = true)
    public NodeReviewSummaryResponse getReviewsForStudent(Long nodeId, Long studentId) {
        LearningNode node = getNode(nodeId);
        assertStudentEnrolledInNode(node, studentId);

        NodeReviewSummaryResponse summary = buildSummary(nodeId);
        summary.setCanReview(hasCompletedCourse(studentId, node));
        summary.setMyReview(nodeReviewRepository
                .findByLearningNodeNodeIdAndStudentUserIdAndIsDeletedFalse(nodeId, studentId)
                .map(this::mapReview)
                .orElse(null));
        return summary;
    }

    @Override
    @Transactional
    public NodeReviewResponse submitReview(Long nodeId, Long studentId, CreateNodeReviewRequest request) {
        LearningNode node = getNode(nodeId);
        assertStudentEnrolledInNode(node, studentId);
        if (!hasCompletedCourse(studentId, node)) {
            throw new InvalidDataException(
                    "Bạn cần hoàn thành toàn bộ lộ trình của lớp-môn trước khi đánh giá bài học.");
        }

        // Upsert: tái dùng bản ghi cũ (kể cả đã xóa mềm) để không vỡ UNIQUE(student_id, node_id).
        NodeReview review = nodeReviewRepository
                .findByLearningNodeNodeIdAndStudentUserId(nodeId, studentId)
                .orElse(null);
        if (review == null) {
            review = NodeReview.builder()
                    .learningNode(node)
                    .student(getUser(studentId))
                    .rating(request.getRating())
                    .content(request.getContent())
                    .isDeleted(false)
                    .build();
        } else {
            review.setRating(request.getRating());
            review.setContent(request.getContent());
            review.setIsDeleted(false); // khôi phục nếu trước đó đã xóa mềm
        }
        nodeReviewRepository.save(review);
        log.info("Student {} reviewed node {} ({} sao)", studentId, nodeId, request.getRating());
        return mapReview(review);
    }

    @Override
    @Transactional
    public void deleteReview(Long nodeId, Long studentId) {
        NodeReview review = nodeReviewRepository
                .findByLearningNodeNodeIdAndStudentUserIdAndIsDeletedFalse(nodeId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn chưa có đánh giá cho bài học này."));
        review.setIsDeleted(true);
        nodeReviewRepository.save(review);
    }

    // ===================== Giảng viên =====================

    @Override
    @Transactional(readOnly = true)
    public NodeReviewSummaryResponse getReviewsForTeacher(Long nodeId, Long teacherId) {
        LearningNode node = getNode(nodeId);
        assertTeacherOwnsNode(node, teacherId);
        return buildSummary(nodeId);
    }

    // ===================== Helpers =====================

    private NodeReviewSummaryResponse buildSummary(Long nodeId) {
        List<NodeReviewResponse> reviews = nodeReviewRepository
                .findByLearningNodeNodeIdAndIsDeletedFalseOrderByCreatedAtDesc(nodeId)
                .stream()
                .map(this::mapReview)
                .collect(Collectors.toList());
        double avg = nodeReviewRepository.averageRatingByNode(nodeId);
        return NodeReviewSummaryResponse.builder()
                .nodeId(nodeId)
                .averageRating(Math.round(avg * 10.0) / 10.0)
                .reviewCount(reviews.size())
                .canReview(false)
                .myReview(null)
                .reviews(reviews)
                .build();
    }

    /**
     * "Đã hoàn thành cả lộ trình" theo lộ trình đã clone của lớp-môn:
     * lộ trình adaptive nên học sinh chỉ có progress cho các node trên nhánh của mình.
     * Coi là hoàn thành khi: có ít nhất 1 node COMPLETED và không còn node nào OPEN/IN_PROGRESS.
     */
    private boolean hasCompletedCourse(Long studentId, LearningNode node) {
        LearningPath path = node.getLearningPath();
        if (path == null) return false;
        List<StudentNodeProgress> progresses = studentNodeProgressRepository
                .findByStudentUserIdAndLearningPathPathId(studentId, path.getPathId());
        if (progresses.isEmpty()) return false;
        boolean anyCompleted = progresses.stream()
                .anyMatch(p -> p.getStatus() == StudentProgressStatus.COMPLETED);
        boolean anyActive = progresses.stream()
                .anyMatch(p -> p.getStatus() == StudentProgressStatus.OPEN
                        || p.getStatus() == StudentProgressStatus.IN_PROGRESS);
        return anyCompleted && !anyActive;
    }

    private LearningNode getNode(Long nodeId) {
        return learningNodeRepository.findById(nodeId)
                .orElseThrow(() -> new ResourceNotFoundException("Learning node not found with id: " + nodeId));
    }

    private UserAccount getUser(Long userId) {
        return userAccountRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
    }

    /** Node phải thuộc một lộ trình đã clone vào lớp-môn (đánh giá là phạm vi lớp-môn). */
    private ClassroomSubject resolveClassroomSubject(LearningNode node) {
        LearningPath path = node.getLearningPath();
        if (path == null || path.getClassroomSubject() == null) {
            throw new InvalidDataException("Bài học này không thuộc lớp-môn nào nên chưa hỗ trợ đánh giá.");
        }
        return path.getClassroomSubject();
    }

    private void assertStudentEnrolledInNode(LearningNode node, Long studentId) {
        ClassroomSubject cs = resolveClassroomSubject(node);
        if (!classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(cs.getId(), studentId)) {
            throw new AccessDeniedException("Bạn không thuộc lớp-môn của bài học này.");
        }
    }

    private void assertTeacherOwnsNode(LearningNode node, Long teacherId) {
        ClassroomSubject cs = resolveClassroomSubject(node);
        if (cs.getLecturer() == null || cs.getLecturer().getUserId() != teacherId) {
            throw new AccessDeniedException("Bạn không phụ trách lớp-môn này.");
        }
    }

    private NodeReviewResponse mapReview(NodeReview r) {
        UserAccount s = r.getStudent();
        return NodeReviewResponse.builder()
                .reviewId(r.getReviewId())
                .nodeId(r.getLearningNode() != null ? r.getLearningNode().getNodeId() : null)
                .rating(r.getRating())
                .content(r.getContent())
                .studentId(s != null ? s.getUserId() : null)
                .studentName(fullName(s))
                .studentAvatarUrl(s != null ? s.getAvatarUrl() : null)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }

    private String fullName(UserAccount u) {
        if (u == null) return null;
        return (u.getFirstName() + " " + u.getLastName()).trim();
    }
}

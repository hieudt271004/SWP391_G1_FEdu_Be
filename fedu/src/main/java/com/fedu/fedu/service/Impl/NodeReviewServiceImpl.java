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

import java.util.Collections;
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

    // ===================== Học sinh & Giảng viên (Chung) =====================

    @Override
    @Transactional(readOnly = true)
    public NodeReviewSummaryResponse getReviewsForStudent(Long nodeId, Long studentId) {
        LearningNode node = getNode(nodeId);
        assertCanParticipate(node, studentId);

        NodeReviewSummaryResponse summary = buildSummary(nodeId);
        summary.setCanReview(hasCompletedCourse(studentId, node));
        summary.setMyReview(nodeReviewRepository
                .findByLearningNodeNodeIdAndAuthorUserIdAndParentReviewIsNullAndRatingIsNotNullAndIsDeletedFalse(nodeId, studentId)
                .map(r -> {
                    // Trả về bản ghi có kèm theo replies nếu có trong summary
                    return summary.getReviews().stream()
                            .filter(rev -> rev.getReviewId().equals(r.getReviewId()))
                            .findFirst()
                            .orElseGet(() -> mapReview(r, false));
                })
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
        if (request.getRating() == null) {
            throw new InvalidDataException("Vui lòng chọn số sao đánh giá.");
        }

        // Upsert: tái dùng bản ghi cũ (kể cả đã xóa mềm) để không vỡ unique index trên root reviews.
        NodeReview review = nodeReviewRepository
                .findByLearningNodeNodeIdAndAuthorUserIdAndParentReviewIsNullAndRatingIsNotNull(nodeId, studentId)
                .orElse(null);
        if (review == null) {
            review = NodeReview.builder()
                    .learningNode(node)
                    .author(getUser(studentId))
                    .parentReview(null)
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
        return mapReview(review, false);
    }

    @Override
    @Transactional
    public NodeReviewResponse createComment(Long nodeId, Long authorId, CreateNodeReviewRequest request) {
        LearningNode node = getNode(nodeId);
        assertCanParticipate(node, authorId);

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new InvalidDataException("Nội dung thảo luận không được để trống.");
        }

        NodeReview comment = NodeReview.builder()
                .learningNode(node)
                .author(getUser(authorId))
                .parentReview(null)
                .rating(null) // comment không có rating
                .content(request.getContent())
                .isDeleted(false)
                .build();

        nodeReviewRepository.save(comment);
        log.info("User {} created comment on node {}", authorId, nodeId);
        return mapReview(comment, false);
    }

    @Override
    @Transactional
    public NodeReviewResponse replyToReview(Long nodeId, Long parentReviewId, Long authorId,
                                            CreateNodeReviewRequest request) {
        LearningNode node = getNode(nodeId);
        assertCanParticipate(node, authorId);

        // Tìm review/comment cha
        NodeReview parentReview = nodeReviewRepository.findById(parentReviewId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Đánh giá hoặc thảo luận gốc không tồn tại với id: " + parentReviewId));

        // Review cha phải thuộc cùng node
        if (!parentReview.getLearningNode().getNodeId().equals(nodeId)) {
            throw new InvalidDataException("Bản ghi cha không thuộc bài học này.");
        }

        // Review cha phải chưa bị xóa
        if (Boolean.TRUE.equals(parentReview.getIsDeleted())) {
            throw new InvalidDataException("Không thể phản hồi thảo luận đã bị xóa.");
        }

        // Chặn reply-to-reply: cha của reply phải là root (parentReview.getParentReview() == null)
        if (parentReview.getParentReview() != null) {
            throw new InvalidDataException("Chỉ được phản hồi trực tiếp các đánh giá hoặc thảo luận gốc.");
        }

        if (request.getContent() == null || request.getContent().trim().isEmpty()) {
            throw new InvalidDataException("Nội dung phản hồi không được để trống.");
        }

        // Tạo reply (không cần rating, chỉ cần content)
        NodeReview reply = NodeReview.builder()
                .learningNode(node)
                .author(getUser(authorId))
                .parentReview(parentReview)
                .rating(null) // reply không có rating
                .content(request.getContent())
                .isDeleted(false)
                .build();
        nodeReviewRepository.save(reply);
        log.info("User {} replied to review {} on node {}", authorId, parentReviewId, nodeId);
        return mapReview(reply, false);
    }

    @Override
    @Transactional
    public void deleteReview(Long nodeId, Long studentId) {
        NodeReview review = nodeReviewRepository
                .findByLearningNodeNodeIdAndAuthorUserIdAndParentReviewIsNullAndRatingIsNotNullAndIsDeletedFalse(nodeId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Bạn chưa có đánh giá cho bài học này."));
        review.setIsDeleted(true);
        nodeReviewRepository.save(review);
        log.info("Student {} deleted review for node {}", studentId, nodeId);
    }

    @Override
    @Transactional
    public void deleteComment(Long commentId, Long authorId) {
        NodeReview comment = nodeReviewRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Thảo luận không tồn tại với id: " + commentId));

        // Chỉ cho phép xóa thảo luận của chính mình
        if (comment.getAuthor() == null || !Long.valueOf(authorId).equals(comment.getAuthor().getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa thảo luận này.");
        }

        // Phải là comment root (parentReview == null && rating == null)
        if (comment.getParentReview() != null) {
            throw new InvalidDataException("Đây là phản hồi, vui lòng dùng chức năng xóa phản hồi.");
        }
        if (comment.getRating() != null) {
            throw new InvalidDataException("Đây là đánh giá học tập, vui lòng dùng chức năng xóa đánh giá.");
        }

        comment.setIsDeleted(true);
        nodeReviewRepository.save(comment);
        log.info("User {} deleted comment {}", authorId, commentId);
    }

    @Override
    @Transactional
    public void deleteReply(Long replyId, Long authorId) {
        NodeReview reply = nodeReviewRepository.findById(replyId)
                .orElseThrow(() -> new ResourceNotFoundException("Phản hồi không tồn tại với id: " + replyId));

        // Chỉ cho phép xóa reply của chính mình (sử dụng equals thay cho !=)
        if (reply.getAuthor() == null || !Long.valueOf(authorId).equals(reply.getAuthor().getUserId())) {
            throw new AccessDeniedException("Bạn không có quyền xóa phản hồi này.");
        }

        // Phải là reply (có parentReview), không phải review/comment gốc
        if (reply.getParentReview() == null) {
            throw new InvalidDataException("Đây là thảo luận gốc, vui lòng dùng chức năng xóa thảo luận.");
        }

        reply.setIsDeleted(true);
        nodeReviewRepository.save(reply);
        log.info("User {} deleted reply {}", authorId, replyId);
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
        // Query toàn bộ root (reviews + comments) trong 1 câu truy vấn
        List<NodeReview> roots = nodeReviewRepository
                .findByLearningNodeNodeIdAndParentReviewIsNullAndIsDeletedFalseOrderByCreatedAtDesc(nodeId);

        // Query toàn bộ replies của node đó trong 1 câu truy vấn (cũ nhất trước)
        List<NodeReview> allReplies = nodeReviewRepository
                .findByLearningNodeNodeIdAndParentReviewIsNotNullAndIsDeletedFalseOrderByCreatedAtAsc(nodeId);

        // Gom nhóm replies theo parentReviewId trong bộ nhớ để tránh N+1 queries
        java.util.Map<Long, List<NodeReviewResponse>> repliesByParentId = allReplies.stream()
                .map(reply -> mapReview(reply, false))
                .filter(r -> r.getParentReviewId() != null)
                .collect(Collectors.groupingBy(NodeReviewResponse::getParentReviewId));

        List<NodeReviewResponse> reviews = new java.util.ArrayList<>();
        List<NodeReviewResponse> comments = new java.util.ArrayList<>();

        for (NodeReview root : roots) {
            NodeReviewResponse mapped = mapReview(root, false);
            mapped.setReplies(repliesByParentId.getOrDefault(root.getReviewId(), Collections.emptyList()));

            if (root.getRating() != null) {
                reviews.add(mapped);
            } else {
                comments.add(mapped);
            }
        }

        double avg = nodeReviewRepository.averageRatingByNode(nodeId);

        return NodeReviewSummaryResponse.builder()
                .nodeId(nodeId)
                .averageRating(Math.round(avg * 10.0) / 10.0)
                .reviewCount(reviews.size())
                .canReview(false)
                .myReview(null)
                .reviews(reviews)
                .comments(comments)
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

    private void assertCanParticipate(LearningNode node, Long userId) {
        ClassroomSubject cs = resolveClassroomSubject(node);
        boolean isStudent = classroomSubjectStudentRepository.existsByClassroomSubject_IdAndStudent_UserId(cs.getId(), userId);
        boolean isTeacher = cs.getLecturer() != null && cs.getLecturer().getUserId() == userId;
        if (!isStudent && !isTeacher) {
            throw new AccessDeniedException("Bạn không thuộc lớp-môn của bài học này hoặc không phụ trách lớp-môn này.");
        }
    }

    /**
     * Map entity sang response DTO.
     * @param includeReplies true để load và map replies (dùng cho danh sách tổng hợp), false cho single response.
     */
    private NodeReviewResponse mapReview(NodeReview r, boolean includeReplies) {
        UserAccount author = r.getAuthor();
        String authorRole = "STUDENT";
        if (author != null && author.getUserRoles() != null) {
            boolean isTeacher = author.getUserRoles().stream()
                    .anyMatch(ur -> ur.getRole() != null && ur.getRole().getRoleName() == com.fedu.fedu.utils.enums.UserRole.TEACHER);
            if (isTeacher) {
                authorRole = "TEACHER";
            }
        }

        NodeReviewResponse.NodeReviewResponseBuilder builder = NodeReviewResponse.builder()
                .reviewId(r.getReviewId())
                .nodeId(r.getLearningNode() != null ? r.getLearningNode().getNodeId() : null)
                .parentReviewId(r.getParentReview() != null ? r.getParentReview().getReviewId() : null)
                .rating(r.getRating())
                .content(r.getContent())
                .studentId(author != null ? author.getUserId() : null)
                .studentName(fullName(author))
                .studentAvatarUrl(author != null ? author.getAvatarUrl() : null)
                .authorRole(authorRole)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt());

        if (includeReplies) {
            List<NodeReviewResponse> replies = nodeReviewRepository
                    .findByLearningNodeNodeIdAndParentReviewIsNotNullAndIsDeletedFalseOrderByCreatedAtAsc(r.getReviewId())
                    .stream()
                    .filter(reply -> reply.getParentReview() != null && reply.getParentReview().getReviewId().equals(r.getReviewId()))
                    .map(reply -> mapReview(reply, false)) // chỉ 1 cấp reply, không đệ quy sâu
                    .collect(Collectors.toList());
            builder.replies(replies);
        } else {
            builder.replies(Collections.emptyList());
        }

        return builder.build();
    }

    private String fullName(UserAccount u) {
        if (u == null) return null;
        return (u.getFirstName() + " " + u.getLastName()).trim();
    }
}

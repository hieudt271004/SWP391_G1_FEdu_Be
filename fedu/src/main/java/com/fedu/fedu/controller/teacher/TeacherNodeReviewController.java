package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.CreateNodeReviewRequest;
import com.fedu.fedu.dto.res.NodeReviewResponse;
import com.fedu.fedu.dto.res.NodeReviewSummaryResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.NodeReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@Validated
@RestController
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Node Review Controller", description = "Giảng viên quản lý và phản hồi thảo luận/đánh giá bài học")
public class TeacherNodeReviewController {

    private final NodeReviewService nodeReviewService;

    @Operation(summary = "Xem tổng hợp đánh giá của một node mình phụ trách")
    @PreAuthorize("hasAnyAuthority('ROLE_TEACHER', 'ROLE_ADMIN')")
    @GetMapping("/learning-nodes/{nodeId}/reviews")
    public ResponseData<NodeReviewSummaryResponse> getReviews(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy đánh giá thành công",
                nodeReviewService.getReviewsForTeacher(nodeId, currentUser.getUserId()));
    }

    @Operation(summary = "Giảng viên gửi thảo luận (comment) cho một bài học")
    @PreAuthorize("hasAnyAuthority('ROLE_TEACHER', 'ROLE_ADMIN')")
    @PostMapping("/learning-nodes/{nodeId}/comments")
    public ResponseData<NodeReviewResponse> createComment(
            @PathVariable Long nodeId,
            @Valid @RequestBody CreateNodeReviewRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} submits comment on node {}", currentUser.getUserId(), nodeId);
        return new ResponseData<>(HttpStatus.OK.value(), "Gửi thảo luận thành công",
                nodeReviewService.createComment(nodeId, currentUser.getUserId(), request));
    }

    @Operation(summary = "Giảng viên phản hồi (reply) một đánh giá hoặc thảo luận khác")
    @PreAuthorize("hasAnyAuthority('ROLE_TEACHER', 'ROLE_ADMIN')")
    @PostMapping("/learning-nodes/{nodeId}/comments/{commentId}/replies")
    public ResponseData<NodeReviewResponse> reply(
            @PathVariable Long nodeId,
            @PathVariable Long commentId,
            @Valid @RequestBody CreateNodeReviewRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} replies to comment {} on node {}", currentUser.getUserId(), commentId, nodeId);
        return new ResponseData<>(HttpStatus.OK.value(), "Trả lời thành công",
                nodeReviewService.replyToReview(nodeId, commentId, currentUser.getUserId(), request));
    }

    @Operation(summary = "Giảng viên xóa thảo luận gốc của chính mình")
    @PreAuthorize("hasAnyAuthority('ROLE_TEACHER', 'ROLE_ADMIN')")
    @DeleteMapping("/comments/{commentId}")
    public ResponseData<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal UserAccount currentUser) {
        nodeReviewService.deleteComment(commentId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Xóa thảo luận thành công");
    }

    @Operation(summary = "Giảng viên xóa reply của chính mình")
    @PreAuthorize("hasAnyAuthority('ROLE_TEACHER', 'ROLE_ADMIN')")
    @DeleteMapping("/replies/{replyId}")
    public ResponseData<Void> deleteReply(
            @PathVariable Long replyId,
            @AuthenticationPrincipal UserAccount currentUser) {
        nodeReviewService.deleteReply(replyId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Xóa reply thành công");
    }
}

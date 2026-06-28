package com.fedu.fedu.controller;

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
@RequestMapping("/student")
@RequiredArgsConstructor
@Tag(name = "Student Node Review Controller", description = "Học sinh đánh giá bài học sau khi hoàn thành lộ trình")
public class StudentNodeReviewController {

    private final NodeReviewService nodeReviewService;

    @Operation(summary = "Xem tổng hợp đánh giá của một node (kèm đánh giá của tôi)")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/learning-nodes/{nodeId}/reviews")
    public ResponseData<NodeReviewSummaryResponse> getReviews(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy đánh giá thành công",
                nodeReviewService.getReviewsForStudent(nodeId, currentUser.getUserId()));
    }

    @Operation(summary = "Gửi/cập nhật đánh giá của chính mình cho một node")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/learning-nodes/{nodeId}/reviews")
    public ResponseData<NodeReviewResponse> submit(
            @PathVariable Long nodeId,
            @Valid @RequestBody CreateNodeReviewRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student {} submits review on node {}", currentUser.getUserId(), nodeId);
        return new ResponseData<>(HttpStatus.OK.value(), "Đánh giá thành công",
                nodeReviewService.submitReview(nodeId, currentUser.getUserId(), request));
    }

    @Operation(summary = "Xóa đánh giá của chính mình")
    @PreAuthorize("hasRole('STUDENT')")
    @DeleteMapping("/learning-nodes/{nodeId}/reviews")
    public ResponseData<Void> delete(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        nodeReviewService.deleteReview(nodeId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Xóa đánh giá thành công");
    }
}

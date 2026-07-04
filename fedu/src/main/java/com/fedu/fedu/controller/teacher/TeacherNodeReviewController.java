package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.res.NodeReviewSummaryResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.NodeReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Teacher Node Review Controller", description = "Giảng viên xem đánh giá bài học của học sinh")
public class TeacherNodeReviewController {

    private final NodeReviewService nodeReviewService;

    @Operation(summary = "Xem tổng hợp đánh giá của một node mình phụ trách")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/learning-nodes/{nodeId}/reviews")
    public ResponseData<NodeReviewSummaryResponse> getReviews(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy đánh giá thành công",
                nodeReviewService.getReviewsForTeacher(nodeId, currentUser.getUserId()));
    }
}

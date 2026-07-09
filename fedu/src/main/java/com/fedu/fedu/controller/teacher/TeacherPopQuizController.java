package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.CreatePopQuizRequest;
import com.fedu.fedu.dto.res.PopQuizAssignmentResponse;
import com.fedu.fedu.dto.res.PopQuizResultsResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.PopQuizService;
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
@Tag(name = "Teacher Pop Quiz Controller", description = "Giao và quản lý bài kiểm tra ad-hoc trong buổi ON_CLASS")
public class TeacherPopQuizController {

    private final PopQuizService popQuizService;

    @Operation(summary = "Giao pop quiz cho danh sách học sinh trong buổi ON_CLASS")
    @PreAuthorize("hasRole('TEACHER')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/on-class/{nodeId}/pop-quiz")
    public ResponseData<PopQuizAssignmentResponse> createAndAssign(
            @PathVariable Long nodeId,
            @Valid @RequestBody CreatePopQuizRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} assigns pop quiz on node {}", currentUser.getUserId(), nodeId);
        PopQuizAssignmentResponse response = popQuizService.createAndAssign(nodeId, request, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Đã giao pop quiz", response);
    }

    @Operation(summary = "Lấy assignment pop quiz đang hoạt động tại node")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/on-class/{nodeId}/pop-quiz/active")
    public ResponseData<PopQuizAssignmentResponse> getActiveAssignment(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        PopQuizAssignmentResponse response = popQuizService.getActiveAssignment(nodeId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Bài pop quiz đang hoạt động", response);
    }

    @Operation(summary = "Xem kết quả pop quiz theo assignment")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/pop-quiz/{assignmentId}/results")
    public ResponseData<PopQuizResultsResponse> getResults(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {
        PopQuizResultsResponse response = popQuizService.getResults(assignmentId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Kết quả pop quiz", response);
    }

    @Operation(summary = "Reset lượt làm bài của một học sinh để làm lại")
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/pop-quiz/{assignmentId}/students/{cssId}/reset")
    public ResponseData<Void> resetStudent(
            @PathVariable Long assignmentId,
            @PathVariable Long cssId,
            @AuthenticationPrincipal UserAccount currentUser) {
        popQuizService.resetStudent(assignmentId, cssId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã reset lượt làm bài", null);
    }

    @Operation(summary = "Đóng lượt giao pop quiz")
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/pop-quiz/{assignmentId}/close")
    public ResponseData<Void> closeAssignment(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {
        popQuizService.closeAssignment(assignmentId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã đóng pop quiz", null);
    }
}

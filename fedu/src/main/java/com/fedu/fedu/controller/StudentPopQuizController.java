package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.AttemptSubmissionResultResponse;
import com.fedu.fedu.dto.res.PopQuizPaperResponse;
import com.fedu.fedu.dto.res.PopQuizPendingResponse;
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
@RequestMapping("/student")
@RequiredArgsConstructor
@Tag(name = "Student Pop Quiz Controller", description = "Nhận, làm và nộp bài kiểm tra ad-hoc trong buổi ON_CLASS")
public class StudentPopQuizController {

    private final PopQuizService popQuizService;

    @Operation(summary = "Poll bài pop quiz được giao tại buổi ON_CLASS đang xem")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/on-class/{nodeId}/pop-quiz/pending")
    public ResponseData<PopQuizPendingResponse> getPending(
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        PopQuizPendingResponse response = popQuizService.getPending(nodeId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Trạng thái pop quiz", response);
    }

    @Operation(summary = "Bắt đầu làm pop quiz (đúng 1 lượt)")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/pop-quiz/{assignmentId}/start")
    public ResponseData<PopQuizPaperResponse> startAttempt(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {
        PopQuizPaperResponse response = popQuizService.startAttempt(assignmentId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Đã bắt đầu làm bài", response);
    }

    @Operation(summary = "Lấy lại đề đang làm (refresh/mất mạng/đổi máy)")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/pop-quiz/{assignmentId}/paper")
    public ResponseData<PopQuizPaperResponse> getPaper(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {
        PopQuizPaperResponse response = popQuizService.getPaper(assignmentId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đề đang làm", response);
    }

    @Operation(summary = "Nộp bài pop quiz")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/pop-quiz/{assignmentId}/submit")
    public ResponseData<AttemptSubmissionResultResponse> submit(
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody AttemptSubmissionRequest request) {
        AttemptSubmissionResultResponse response = popQuizService.submit(assignmentId, currentUser.getUserId(), request);
        return new ResponseData<>(HttpStatus.OK.value(), "Đã nộp bài", response);
    }
}

package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.AttemptSubmissionResultResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.StudentTestAttempt;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.StudentTestService;
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
@Tag(name = "Student Test Controller", description = "Endpoints for students to fetch test details and submit attempts")
public class StudentTestController {

    private final StudentTestService studentTestService;

    @Operation(summary = "Get test questions and choices for student taking quiz")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/tests/{testId}")
    public ResponseData<StudentTestDetailsResponse> getStudentTestDetails(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student ID {} requests details for test id: {}", currentUser.getUserId(), testId);
        StudentTestDetailsResponse details = studentTestService.getStudentTestDetails(testId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved test details successfully", details);
    }

    @Operation(summary = "Start a new test attempt")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/tests/{testId}/attempts")
    public ResponseData<StudentTestAttempt> startTestAttempt(
            @PathVariable Long testId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student ID {} starts attempt for test id: {}", currentUser.getUserId(), testId);
        StudentTestAttempt attempt = studentTestService.startTestAttempt(testId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Started test attempt successfully", attempt);
    }

    @Operation(summary = "Submit and grade a test attempt")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/tests/{testId}/attempts/{attemptId}/submit")
    public ResponseData<AttemptSubmissionResultResponse> submitTestAttempt(
            @PathVariable Long testId,
            @PathVariable Long attemptId,
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody AttemptSubmissionRequest request) {
        log.info("Student ID {} submits attempt id: {} for test id: {}", currentUser.getUserId(), attemptId, testId);
        AttemptSubmissionResultResponse result = studentTestService.submitTestAttempt(
                testId, attemptId, currentUser.getUserId(), request);
        return new ResponseData<>(HttpStatus.OK.value(), "Test attempt graded successfully", result);
    }
}

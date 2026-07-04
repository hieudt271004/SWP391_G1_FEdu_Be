package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.CreateSubmissionRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.SubmissionResponse;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.SubmissionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Validated
@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
@Tag(name = "Student Submission Controller", description = "Học sinh nộp bài tập thực hành và xem kết quả chấm")
public class StudentSubmissionController {

    private final SubmissionService submissionService;

    @Operation(summary = "Nộp bài (tự luận và/hoặc file) cho một bài tập")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping(value = "/exercises/{exerciseId}/submissions", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseData<SubmissionResponse> submit(
            @PathVariable Long exerciseId,
            @Valid @ModelAttribute CreateSubmissionRequest request,
            @RequestParam(value = "file", required = false) MultipartFile file,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student {} submitting exercise {}", currentUser.getUserId(), exerciseId);
        return new ResponseData<>(HttpStatus.OK.value(), "Nộp bài thành công",
                submissionService.submit(exerciseId, currentUser.getUserId(), request, file));
    }

    @Operation(summary = "Xem bài nộp của chính mình cho một bài tập")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/exercises/{exerciseId}/submissions/me")
    public ResponseData<SubmissionResponse> getMySubmission(
            @PathVariable Long exerciseId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy bài nộp thành công",
                submissionService.getMySubmission(exerciseId, currentUser.getUserId()));
    }
}

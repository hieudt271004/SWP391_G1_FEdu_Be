package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.GradeSubmissionRequest;
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
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Submission Controller", description = "Giảng viên xem và chấm bài nộp của học sinh")
public class TeacherSubmissionController {

    private final SubmissionService submissionService;

    @Operation(summary = "Xem danh sách bài nộp của một bài tập")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/exercises/{exerciseId}/submissions")
    public ResponseData<List<SubmissionResponse>> listSubmissions(
            @PathVariable Long exerciseId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy danh sách bài nộp thành công",
                submissionService.listForExercise(exerciseId, currentUser.getUserId()));
    }

    @Operation(summary = "Chấm điểm + nhận xét một bài nộp")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @PutMapping("/submissions/{submissionId}/grade")
    public ResponseData<SubmissionResponse> grade(
            @PathVariable Long submissionId,
            @Valid @RequestBody GradeSubmissionRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher {} grading submission {}", currentUser.getUserId(), submissionId);
        return new ResponseData<>(HttpStatus.OK.value(), "Chấm bài thành công",
                submissionService.grade(submissionId, currentUser.getUserId(), request));
    }
}

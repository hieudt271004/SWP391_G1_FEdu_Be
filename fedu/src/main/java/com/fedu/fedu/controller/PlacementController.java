package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.AttemptSubmissionRequest;
import com.fedu.fedu.dto.res.PlacementResultResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.StudentLevelHistoryResponse;
import com.fedu.fedu.dto.res.StudentTestDetailsResponse;
import com.fedu.fedu.entity.StudentTestAttempt;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.PlacementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/student")
@RequiredArgsConstructor
@Tag(name = "Placement Quiz Controller", description = "Bài test phân loại đầu vào của học sinh")
public class PlacementController {

    private final PlacementService placementService;

    @Operation(summary = "Lấy đề bài test phân loại của lớp-môn")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/classroom-subjects/{csId}/placement-quiz")
    public ResponseData<StudentTestDetailsResponse> getPlacementQuiz(
            @PathVariable Long csId,
            @AuthenticationPrincipal UserAccount currentUser) {
        StudentTestDetailsResponse details = placementService.getPlacementQuiz(csId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy bài test phân loại thành công", details);
    }

    @Operation(summary = "Bắt đầu lượt làm bài test phân loại")
    @PreAuthorize("hasRole('STUDENT')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/classroom-subjects/{csId}/placement-quiz/attempts")
    public ResponseData<StudentTestAttempt> startPlacementAttempt(
            @PathVariable Long csId,
            @AuthenticationPrincipal UserAccount currentUser) {
        StudentTestAttempt attempt = placementService.startPlacementAttempt(csId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Bắt đầu bài test phân loại", attempt);
    }

    @Operation(summary = "Nộp bài test phân loại và nhận mức năng lực")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/classroom-subjects/{csId}/placement-quiz/attempts/{attemptId}/submit")
    public ResponseData<PlacementResultResponse> submitPlacement(
            @PathVariable Long csId,
            @PathVariable Long attemptId,
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody AttemptSubmissionRequest request) {
        PlacementResultResponse result = placementService.submitPlacement(
                csId, attemptId, currentUser.getUserId(), request);
        return new ResponseData<>(HttpStatus.OK.value(), "Đã phân loại và gán mức học", result);
    }

    @Operation(summary = "Hủy lượt làm bài test phân loại")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/classroom-subjects/{csId}/placement-quiz/cancel")
    public ResponseData<Void> cancelPlacementAttempt(
            @PathVariable Long csId,
            @AuthenticationPrincipal UserAccount currentUser) {
        placementService.cancelPlacementAttempt(csId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Hủy bài test phân loại thành công", null);
    }

    @Operation(summary = "Lịch sử thay đổi mức của bản thân trong lớp-môn")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/classroom-subjects/{csId}/level-history")
    public ResponseData<List<StudentLevelHistoryResponse>> getMyLevelHistory(
            @PathVariable Long csId,
            @AuthenticationPrincipal UserAccount currentUser) {
        List<StudentLevelHistoryResponse> history = placementService.getLevelHistory(csId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Lịch sử mức năng lực", history);
    }
}

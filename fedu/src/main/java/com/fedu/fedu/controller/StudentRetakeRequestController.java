package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.RetakeRequestPayload;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.RetakeRequestResponse;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.RetakeRequestService;
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
@RequestMapping("/student")
@RequiredArgsConstructor
@Tag(name = "Student Retake Request Controller", description = "Endpoints for students to request test retakes")
public class StudentRetakeRequestController {

    private final RetakeRequestService retakeRequestService;

    @Operation(summary = "Submit a retake request for a test")
    @PreAuthorize("hasRole('STUDENT')")
    @PostMapping("/retake-requests")
    public ResponseData<RetakeRequestResponse> createRequest(
            @AuthenticationPrincipal UserAccount currentUser,
            @Valid @RequestBody RetakeRequestPayload payload) {
        log.info("Student {} submitting retake request for test {}", currentUser.getUserId(), payload.getTestId());
        RetakeRequestResponse response = retakeRequestService.createRequest(currentUser.getUserId(), payload);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Gửi yêu cầu thi lại thành công", response);
    }

    @Operation(summary = "Get retake request history for student in a classroom subject")
    @PreAuthorize("hasRole('STUDENT')")
    @GetMapping("/classroom-subjects/{csId}/retake-requests")
    public ResponseData<List<RetakeRequestResponse>> getStudentRequests(
            @AuthenticationPrincipal UserAccount currentUser,
            @PathVariable Long csId) {
        log.info("Student {} requesting retake history for cs {}", currentUser.getUserId(), csId);
        List<RetakeRequestResponse> list = retakeRequestService.getStudentRequests(currentUser.getUserId(), csId);
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy lịch sử yêu cầu thi lại thành công", list);
    }
}

package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.RetakeResolvePayload;
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
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Retake Request Controller", description = "Endpoints for teachers to approve or reject student retake requests")
public class TeacherRetakeRequestController {

    private final RetakeRequestService retakeRequestService;

    @Operation(summary = "Get pending retake requests for a classroom subject")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/classroom-subjects/{csId}/retake-requests")
    public ResponseData<List<RetakeRequestResponse>> getPendingRequests(
            @AuthenticationPrincipal UserAccount currentUser,
            @PathVariable Long csId) {
        log.info("Teacher {} fetching pending retake requests for cs {}", currentUser.getUserId(), csId);
        List<RetakeRequestResponse> list = retakeRequestService.getTeacherPendingRequests(currentUser.getUserId(), csId);
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy danh sách yêu cầu thi lại thành công", list);
    }

    @Operation(summary = "Approve or reject a student retake request")
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/retake-requests/{requestId}/resolve")
    public ResponseData<RetakeRequestResponse> resolveRequest(
            @AuthenticationPrincipal UserAccount currentUser,
            @PathVariable Long requestId,
            @Valid @RequestBody RetakeResolvePayload payload) {
        log.info("Teacher {} resolving retake request {} with status {}", 
                currentUser.getUserId(), requestId, payload.getStatus());
        RetakeRequestResponse response = retakeRequestService.resolveRequest(currentUser.getUserId(), requestId, payload);
        return new ResponseData<>(HttpStatus.OK.value(), "Xử lý yêu cầu thi lại thành công", response);
    }
}

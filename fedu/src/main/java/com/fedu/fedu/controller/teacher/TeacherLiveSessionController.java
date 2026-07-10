package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.res.LiveSessionStateResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.LiveSessionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Validated
@RestController
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Live Session Controller", description = "Màn hình dạy học: buổi live của node ON_CLASS (bắt đầu/kết thúc, phát đề, polling trạng thái)")
public class TeacherLiveSessionController {

    private final LiveSessionService liveSessionService;

    @Operation(summary = "Trạng thái buổi học live (teacher polling ~5s)")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/classroom-subjects/{csId}/learning-nodes/{nodeId}/live-state")
    public ResponseData<LiveSessionStateResponse> getLiveState(
            @PathVariable Long csId,
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy trạng thái buổi học thành công",
                liveSessionService.getTeacherState(csId, nodeId, currentUser.getUserId()));
    }

    @Operation(summary = "Bắt đầu buổi học (chỉ trong khung giờ slot; mở khóa node cho cả lớp)")
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/classroom-subjects/{csId}/learning-nodes/{nodeId}/live-session/start")
    public ResponseData<LiveSessionStateResponse> startSession(
            @PathVariable Long csId,
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Đã bắt đầu buổi học",
                liveSessionService.startSession(csId, nodeId, currentUser.getUserId()));
    }

    @Operation(summary = "Kết thúc buổi học")
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/classroom-subjects/{csId}/learning-nodes/{nodeId}/live-session/end")
    public ResponseData<LiveSessionStateResponse> endSession(
            @PathVariable Long csId,
            @PathVariable Long nodeId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Đã kết thúc buổi học",
                liveSessionService.endSession(csId, nodeId, currentUser.getUserId()));
    }

    @Operation(summary = "Phát đề cho cả lớp (hạn nộp chung = bây giờ + thời lượng đề)")
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/classroom-subjects/{csId}/learning-nodes/{nodeId}/live-session/tests/{testId}/release")
    public ResponseData<LiveSessionStateResponse> releaseTest(
            @PathVariable Long csId,
            @PathVariable Long nodeId,
            @PathVariable Long testId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Đã phát đề cho cả lớp",
                liveSessionService.releaseTest(csId, nodeId, testId, currentUser.getUserId()));
    }
}

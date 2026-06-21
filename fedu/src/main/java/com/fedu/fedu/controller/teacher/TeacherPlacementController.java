package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.CreatePlacementQuizRequest;
import com.fedu.fedu.dto.res.PlacementQuizDetailsResponse;
import com.fedu.fedu.dto.req.ScoreBandRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.ScoreBandResponse;
import com.fedu.fedu.dto.res.StudentLevelHistoryResponse;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.PlacementService;
import com.fedu.fedu.service.TeacherPlacementService;
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
@Tag(name = "Teacher Placement Controller", description = "Cấu hình bài test phân loại và khoảng điểm")
public class TeacherPlacementController {

    private final TeacherPlacementService teacherPlacementService;
    private final PlacementService placementService;

    @Operation(summary = "Gán bài test phân loại cho lớp-môn")
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/classroom-subjects/{csId}/placement-quiz/{testId}")
    public ResponseData<Void> setPlacementQuiz(
            @PathVariable Long csId,
            @PathVariable Long testId,
            @AuthenticationPrincipal UserAccount currentUser) {
        teacherPlacementService.setPlacementQuiz(csId, testId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã gán bài test phân loại cho lớp-môn", null);
    }

    @Operation(summary = "Cấu hình khoảng điểm (score band) cho một bài quiz")
    @PreAuthorize("hasRole('TEACHER')")
    @PutMapping("/tests/{testId}/score-bands")
    public ResponseData<List<ScoreBandResponse>> configureScoreBands(
            @PathVariable Long testId,
            @RequestBody List<@Valid ScoreBandRequest> bands,
            @AuthenticationPrincipal UserAccount currentUser) {
        List<ScoreBandResponse> result =
                teacherPlacementService.configureScoreBands(testId, bands, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã cập nhật khoảng điểm", result);
    }

    @Operation(summary = "Lấy khoảng điểm hiện có của một bài quiz")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/tests/{testId}/score-bands")
    public ResponseData<List<ScoreBandResponse>> getScoreBands(@PathVariable Long testId) {
        return new ResponseData<>(HttpStatus.OK.value(), "Khoảng điểm", teacherPlacementService.getScoreBands(testId));
    }

    @Operation(summary = "Lịch sử thay đổi mức của một học sinh trong lớp-môn")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/classroom-subjects/{csId}/students/{studentId}/level-history")
    public ResponseData<List<StudentLevelHistoryResponse>> getStudentLevelHistory(
            @PathVariable Long csId,
            @PathVariable Long studentId) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lịch sử mức năng lực",
                placementService.getLevelHistory(csId, studentId));
    }

    @Operation(summary = "Tạo mới hoặc cập nhật bài test phân loại")
    @PreAuthorize("hasRole('TEACHER')")
    @PostMapping("/classroom-subjects/{csId}/placement-quiz")
    public ResponseData<PlacementQuizDetailsResponse> createPlacementQuiz(
            @PathVariable Long csId,
            @Valid @RequestBody CreatePlacementQuizRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher creating/updating placement quiz for classroom subject ID: {}", csId);
        PlacementQuizDetailsResponse response = teacherPlacementService.createPlacementQuiz(csId, request, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Khởi tạo bài test phân loại thành công", response);
    }

    @Operation(summary = "Lấy thông tin chi tiết bài test phân loại")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/classroom-subjects/{csId}/placement-quiz")
    public ResponseData<PlacementQuizDetailsResponse> getPlacementQuizDetails(
            @PathVariable Long csId,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Teacher retrieving placement quiz details for classroom subject ID: {}", csId);
        PlacementQuizDetailsResponse response = teacherPlacementService.getPlacementQuizDetails(csId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy chi tiết bài test phân loại thành công", response);
    }
}

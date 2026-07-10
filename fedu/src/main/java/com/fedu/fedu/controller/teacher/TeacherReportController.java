package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.StudentProgressReportResponse;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.TeacherReportService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Report Controller", description = "Báo cáo theo dõi tiến độ học sinh cho giảng viên")
public class TeacherReportController {

    private final TeacherReportService teacherReportService;

    @Operation(summary = "Báo cáo theo dõi học sinh của lớp-môn (tiến độ + hoàn thành trễ hạn)")
    @PreAuthorize("hasRole('TEACHER')")
    @GetMapping("/classroom-subjects/{csId}/progress-report")
    public ResponseData<List<StudentProgressReportResponse>> getProgressReport(
            @PathVariable Long csId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy báo cáo theo dõi học sinh thành công",
                teacherReportService.getProgressReport(csId, currentUser.getUserId()));
    }
}

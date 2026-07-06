package com.fedu.fedu.controller;

import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.StudentScheduleEntry;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.StudentScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/student/schedule")
@RequiredArgsConstructor
@Tag(name = "Student Schedule Controller", description = "APIs for student to view their personal timetable")
public class StudentScheduleController {

    private final StudentScheduleService studentScheduleService;

    @Operation(summary = "Get personal schedule/timetable for current student")
    @PreAuthorize("hasAuthority('ROLE_STUDENT')")
    @GetMapping
    public ResponseData<List<StudentScheduleEntry>> getStudentSchedule(
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Student {} requests schedule/timetable", currentUser.getUserId());
        List<StudentScheduleEntry> schedule = studentScheduleService.getStudentSchedule(currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Lấy thời khóa biểu thành công", schedule);
    }
}

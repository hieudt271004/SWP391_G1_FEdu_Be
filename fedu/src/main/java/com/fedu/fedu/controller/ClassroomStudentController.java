package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.service.ClassroomStudentService;
import com.fedu.fedu.service.ClassroomEnrollmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/classroom-subjects/{classroomSubjectId}/students")
@RequiredArgsConstructor
@Tag(name = "Classroom Student Controller", description = "Classroom Student Roster Management")
public class ClassroomStudentController {

    private final ClassroomStudentService classroomStudentService;
    private final ClassroomEnrollmentService classroomEnrollmentService;

    @Operation(summary = "Thêm sinh viên vào lớp-môn bằng email")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ResponseData<StudentInClassResponse> addStudent(
            @PathVariable Long classroomSubjectId,
            @Valid @RequestBody AddStudentRequest request) {
        return new ResponseData<>(HttpStatus.CREATED.value(), "Đã thêm sinh viên vào lớp-môn",
                classroomEnrollmentService.enrollStudent(classroomSubjectId, request));
    }

    @Operation(summary = "Gỡ sinh viên khỏi lớp-môn")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{studentId}")
    public ResponseData<Void> removeStudent(
            @PathVariable Long classroomSubjectId,
            @PathVariable long studentId) {
        classroomStudentService.removeStudentFromClassroomSubject(classroomSubjectId, studentId);
        return new ResponseData<>(HttpStatus.OK.value(), "Đã gỡ sinh viên khỏi lớp-môn");
    }

    @Operation(summary = "Danh sách sinh viên của lớp-môn")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    @GetMapping
    public ResponseData<List<StudentInClassResponse>> getStudents(@PathVariable Long classroomSubjectId) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                classroomStudentService.getStudentsInClassroomSubject(classroomSubjectId));
    }
}

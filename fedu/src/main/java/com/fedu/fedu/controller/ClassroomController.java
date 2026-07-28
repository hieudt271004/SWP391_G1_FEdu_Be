package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.ClassroomRequest;
import com.fedu.fedu.dto.req.UpdateClassroomStatusRequest;
import com.fedu.fedu.dto.res.ClassroomResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.ClassroomService;
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
@RequestMapping("/classrooms")
@RequiredArgsConstructor
@Tag(name = "Classroom Controller", description = "Classroom Management")
public class ClassroomController {

    private final ClassroomService classroomService;

    @Operation(summary = "Create new classroom (Admin only)")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ResponseData<ClassroomResponse> createClassroom(@Valid @RequestBody ClassroomRequest request) {
        log.info("Request create classroom: {}", request.getClassName());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Classroom created successfully",
                classroomService.createClassroom(request));
    }

    @Operation(summary = "Get all classrooms (Admin only)")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping
    public ResponseData<List<ClassroomResponse>> getAllClassrooms() {
        log.info("Request get all classrooms");
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved classroom list successfully",
                classroomService.getAllClassrooms());
    }

    @Operation(summary = "Get classroom details by ID")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{classroomId}")
    public ResponseData<ClassroomResponse> getClassroomById(@PathVariable Long classroomId) {
        log.info("Request get classroom id: {}", classroomId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved classroom details successfully",
                classroomService.getClassroomById(classroomId));
    }

    @Operation(summary = "Get classrooms by subject")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/subject/{subjectId}")
    public ResponseData<List<ClassroomResponse>> getClassroomsBySubject(@PathVariable Long subjectId) {
        log.info("Request get classrooms by subject id: {}", subjectId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved classroom list successfully",
                classroomService.getClassroomsBySubject(subjectId));
    }

    @Operation(summary = "Get classrooms by teacher")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/teacher/{teacherId}")
    public ResponseData<List<ClassroomResponse>> getClassroomsByTeacher(@PathVariable long teacherId) {
        log.info("Request get classrooms by teacher id: {}", teacherId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved classroom list successfully",
                classroomService.getClassroomsByTeacher(teacherId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseData<List<ClassroomResponse>> getClassroomsByStudent(
            @PathVariable long studentId,
            @AuthenticationPrincipal UserAccount currentUser) {
        boolean isStudentOnly = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))
                && currentUser.getAuthorities().stream()
                .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_TEACHER"));
        if (isStudentOnly && studentId != currentUser.getUserId()) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn chỉ được xem lớp của chính mình");
        }
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved classroom list successfully",
                classroomService.getClassroomsByStudent(studentId));
    }

    @Operation(summary = "Update classroom information")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PutMapping("/{classroomId}")
    public ResponseData<ClassroomResponse> updateClassroom(
            @PathVariable Long classroomId,
            @Valid @RequestBody ClassroomRequest request) {
        log.info("Request update classroom id: {}", classroomId);
        ClassroomResponse response = classroomService.updateClassroom(classroomId, request);
        return new ResponseData<>(HttpStatus.OK.value(), "Classroom updated successfully", response);
    }

    @Operation(summary = "Đổi trạng thái lớp học (bắt đầu / kết thúc / mở lại) — chỉ Admin")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/{classroomId}/status")
    public ResponseData<ClassroomResponse> updateClassroomStatus(
            @PathVariable Long classroomId,
            @Valid @RequestBody UpdateClassroomStatusRequest request) {
        log.info("Request update classroom {} status -> {}", classroomId, request.getStatus());
        return new ResponseData<>(HttpStatus.OK.value(), "Classroom status updated successfully",
                classroomService.updateClassroomStatus(classroomId, request.getStatus()));
    }

    @Operation(summary = "Xóa lớp học (soft delete, chỉ lớp chưa bắt đầu) — chỉ Admin")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/{classroomId}")
    public ResponseData<Void> deleteClassroom(@PathVariable Long classroomId) {
        log.info("Request delete classroom id: {}", classroomId);
        classroomService.deleteClassroom(classroomId);
        return new ResponseData<>(HttpStatus.OK.value(), "Classroom deleted successfully");
    }

}
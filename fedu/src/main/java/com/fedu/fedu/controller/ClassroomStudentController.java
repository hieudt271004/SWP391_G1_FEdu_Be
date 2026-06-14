package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.service.ClassroomStudentService;
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
@RequestMapping("/classrooms/{classroomId}/students")
@RequiredArgsConstructor
@Tag(name = "Classroom Student Controller", description = "Classroom Student Roster Management")
public class ClassroomStudentController {

    private final ClassroomStudentService classroomStudentService;
    private final com.fedu.fedu.service.ClassroomEnrollmentService classroomEnrollmentService;

    @Operation(summary = "Add student to classroom by email")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ResponseData<StudentInClassResponse> addStudentToClassroom(
            @PathVariable Long classroomId,
            @Valid @RequestBody AddStudentRequest request) {
        log.info("Request add student '{}' to classroom id: {}", request.getEmail(), classroomId);
        StudentInClassResponse response = classroomEnrollmentService.enrollStudent(classroomId, request);
        return new ResponseData<>(HttpStatus.CREATED.value(), "Student added to classroom successfully", response);
    }

    @Operation(summary = "Remove student from classroom")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @DeleteMapping("/{studentId}")
    public ResponseData<Void> removeStudentFromClassroom(
            @PathVariable Long classroomId,
            @PathVariable long studentId) {
        log.info("Request remove student id: {} from classroom id: {}", studentId, classroomId);
        classroomStudentService.removeStudentFromClassroom(classroomId, studentId);
        return new ResponseData<>(HttpStatus.OK.value(), "Student removed from classroom successfully");
    }

    @Operation(summary = "Get list of students enrolled in classroom")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping
    public ResponseData<List<StudentInClassResponse>> getStudentsInClassroom(@PathVariable Long classroomId) {
        log.info("Request get students in classroom id: {}", classroomId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved student roster successfully",
                classroomStudentService.getStudentsInClassroom(classroomId));
    }
}
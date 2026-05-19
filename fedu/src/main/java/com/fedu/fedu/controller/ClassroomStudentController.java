package com.fedu.fedu.controller;

import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.ResponseError;
import com.fedu.fedu.entity.ClassroomStudent;
import com.fedu.fedu.service.ClassroomStudentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@Validated
@RestController
@RequestMapping("/classrooms/{classroomId}/students")
@RequiredArgsConstructor
@Tag(name = "Classroom Enrollment Controller", description = "Manage classroom enrollments")
public class ClassroomStudentController {

    private final ClassroomStudentService classroomStudentService;

    @Operation(summary = "Enroll student to a class", description = "Add a student to a specific classroom")
    @PostMapping("/{studentId}")
    public ResponseData<Void> enrollStudentToClass(
            @PathVariable Long classroomId,
            @PathVariable Long studentId) {
        try {
            classroomStudentService.addStudentToClass(classroomId, studentId);
            return new ResponseData<>(HttpStatus.CREATED.value(), "Student enrolled successfully");
        } catch (Exception e) {
            log.error("Failed to enroll student: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Unexpected error: " + e.getMessage());
        }
    }

    @Operation(summary = "Remove student from a class", description = "Remove a student's enrollment from a specific classroom")
    @DeleteMapping("/{studentId}")
    public ResponseData<Void> removeStudentFromClass(
            @PathVariable Long classroomId,
            @PathVariable Long studentId) {
        try {
            classroomStudentService.removeStudentFromClass(classroomId, studentId);
            return new ResponseData<>(HttpStatus.OK.value(), "Student removed successfully");
        } catch (Exception e) {
            log.error("Failed to remove student from class: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to remove student from class");
        }
    }

    @Operation(summary = "Get students in a class", description = "Retrieve the list of all students enrolled in a specific classroom")
    @GetMapping
    public ResponseData<List<ClassroomStudent>> getStudentsInClass(@PathVariable Long classroomId) {
        try {
            List<ClassroomStudent> students = classroomStudentService.getStudentsByClass(classroomId);
            return new ResponseData<>(HttpStatus.OK.value(), "Retrieved list successfully", students);
        } catch (Exception e) {
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Unexpected error: " + e.getMessage());
        }
    }
}
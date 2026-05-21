package com.fedu.fedu.controller;

import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.ResponseError;
import com.fedu.fedu.entity.Teacher;
import com.fedu.fedu.service.TeacherService;
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
@RequestMapping("/teachers")
@RequiredArgsConstructor
@Tag(name = "Teacher Controller", description = "Manage teacher information")
public class TeacherController {

    private final TeacherService teacherService;

    @Operation(summary = "Add a new teacher", description = "Create a new teacher and link to a UserAccount")
    @PostMapping("/add")
    public ResponseData<Teacher> createTeacher(@RequestBody Teacher teacher) {
        try {
            Teacher newTeacher = teacherService.createTeacher(teacher);
            return new ResponseData<>(HttpStatus.CREATED.value(), "Teacher added successfully", newTeacher);
        } catch (Exception e) {
            log.error("Failed to add teacher: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Unexpected error: " + e.getMessage());
        }
    }

    @Operation(summary = "Get teacher list", description = "Retrieve the complete list of teachers in the system")
    @GetMapping("/all")
    public ResponseData<List<Teacher>> getAllTeachers() {
        try {
            return new ResponseData<>(HttpStatus.OK.value(), "Retrieved list successfully", teacherService.getAllTeachers());
        } catch (Exception e) {
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Unexpected error: " + e.getMessage());
        }
    }

    @Operation(summary = "Get teacher details", description = "Retrieve teacher information by ID")
    @GetMapping("/{id}")
    public ResponseData<Teacher> getTeacherById(@PathVariable Long id) {
        try {
            return new ResponseData<>(HttpStatus.OK.value(), "Retrieved information successfully", teacherService.getTeacherById(id));
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Unexpected error: " + e.getMessage());
        }
    }

    @Operation(summary = "Update teacher", description = "Update teacher information by ID")
    @PatchMapping("/{id}")
    public ResponseData<Teacher> updateTeacher(@PathVariable Long id, @RequestBody Teacher teacherDetails) {
        try {
            Teacher updatedTeacher = teacherService.updateTeacher(id, teacherDetails);
            return new ResponseData<>(HttpStatus.ACCEPTED.value(), "Teacher updated successfully", updatedTeacher);
        } catch (Exception e) {
            log.info("{}", e.getMessage(), e.getCause());
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Update teacher failed");
        }
    }

    @Operation(summary = "Delete teacher", description = "Permanently remove a teacher from the system")
    @DeleteMapping("/{id}")
    public ResponseData<Void> deleteTeacher(@PathVariable Long id) {
        try {
            teacherService.deleteTeacher(id);
            return new ResponseData<>(HttpStatus.OK.value(), "Teacher deleted successfully");
        } catch (Exception e) {
            log.error("Failed to delete teacher: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to delete teacher");
        }
    }
}
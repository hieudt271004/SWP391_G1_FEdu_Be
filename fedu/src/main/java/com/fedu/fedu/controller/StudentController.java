package com.fedu.fedu.controller;

import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.ResponseError;
import com.fedu.fedu.entity.Student;
import com.fedu.fedu.service.StudentService;
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
@RequestMapping("/students")
@RequiredArgsConstructor
@Tag(name = "Student Controller", description = "Manage student information")
public class StudentController {

    private final StudentService studentService;

    @Operation(summary = "Add a new student", description = "Save a new student's information into the system")
    @PostMapping("/add")
    public ResponseData<Student> createStudent(@RequestBody Student student) {
        try {
            Student newStudent = studentService.createStudent(student);
            return new ResponseData<>(HttpStatus.CREATED.value(), "Student added successfully", newStudent);
        } catch (Exception e) {
            log.error("Failed to add student: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Unexpected error: " + e.getMessage());
        }
    }

    @Operation(summary = "Get student list", description = "Retrieve the complete list of students in the system")
    @GetMapping("/all")
    public ResponseData<List<Student>> getAllStudents() {
        try {
            return new ResponseData<>(HttpStatus.OK.value(), "Retrieved list successfully", studentService.getAllStudents());
        } catch (Exception e) {
            return new ResponseError(HttpStatus.INTERNAL_SERVER_ERROR.value(), "Unexpected error: " + e.getMessage());
        }
    }

    @Operation(summary = "Get student details", description = "Retrieve student information by ID")
    @GetMapping("/{id}")
    public ResponseData<Student> getStudentById(@PathVariable Long id) {
        try {
            return new ResponseData<>(HttpStatus.OK.value(), "Retrieved information successfully", studentService.getStudentById(id));
        } catch (Exception e) {
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Unexpected error: " + e.getMessage());
        }
    }

    @Operation(summary = "Update student", description = "Update student information by ID")
    @PatchMapping("/{id}")
    public ResponseData<Student> updateStudent(@PathVariable Long id, @RequestBody Student studentDetails) {
        try {
            Student updatedStudent = studentService.updateStudent(id, studentDetails);
            return new ResponseData<>(HttpStatus.ACCEPTED.value(), "Student updated successfully", updatedStudent);
        } catch (Exception e) {
            log.info("{}", e.getMessage(), e.getCause());
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Update student failed");
        }
    }

    @Operation(summary = "Delete student", description = "Permanently remove a student from the system")
    @DeleteMapping("/{id}")
    public ResponseData<Void> deleteStudent(@PathVariable Long id) {
        try {
            studentService.deleteStudent(id);
            return new ResponseData<>(HttpStatus.OK.value(), "Student deleted successfully");
        } catch (Exception e) {
            log.error("Failed to delete student: {}", e.getMessage(), e);
            return new ResponseError(HttpStatus.BAD_REQUEST.value(), "Failed to delete student");
        }
    }
}
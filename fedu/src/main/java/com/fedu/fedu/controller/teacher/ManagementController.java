package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.res.*;
import com.fedu.fedu.service.ClassroomService;
import com.fedu.fedu.service.LearningPathService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@RequestMapping("/teacher")
@RequiredArgsConstructor
@Tag(name = "Teacher Management Controller", description = "APIs for lecturer to manage classrooms and subjects")
public class ManagementController {

    private final ClassroomService classroomService;
    private final LearningPathService learningPathService;

    @Operation(summary = "Get classrooms by lecturer ID",
            description = "Retrieve the list of classrooms assigned to a specific lecturer")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/classrooms/{lecturerId}")
    public ResponseData<List<ClassroomResponse>> getClassroomsByLecturerId(@PathVariable Long lecturerId) {
        List<ClassroomResponse> classrooms = classroomService.getClassroomsByLecturerId(lecturerId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved classrooms successfully", classrooms);
    }

    @Operation(summary = "Get subjects by lecturer ID",
            description = "Retrieve the list of distinct subjects that a lecturer teaches (derived from classrooms)")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/subjects/{lecturerId}")
    public ResponseData<List<SubjectResponse>> getSubjectsByLecturerId(@PathVariable Long lecturerId) {
        List<SubjectResponse> subjects = classroomService.getSubjectsByLecturerId(lecturerId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved subjects successfully", subjects);
    }

    @Operation(summary = "Get learning paths by subject ID",
            description = "Retrieve the list of learning paths associated with a specific subject")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/learning-paths/{subjectId}")
    public ResponseData<List<LearningPathResponse>> getLearningPathsBySubjectId(@PathVariable Long subjectId) {
        List<LearningPathResponse> learningPaths = learningPathService.getLearningPathsBySubjectId(subjectId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved learning paths successfully", learningPaths);
    }
}

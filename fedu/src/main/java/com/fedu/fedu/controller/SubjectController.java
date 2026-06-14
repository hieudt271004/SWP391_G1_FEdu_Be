package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.SubjectRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.SubjectResponse;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.SubjectService;
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
@RequestMapping("/subjects")
@RequiredArgsConstructor
@Tag(name = "Subject Controller")
public class SubjectController {

    private final SubjectService subjectService;

    @Operation(summary = "Create new subject and save into db")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ResponseData<SubjectResponse> createSubject(
            @Valid @RequestBody SubjectRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        log.info("Request create subject: {}", request.getSubjectCode());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Subject created successfully",
                subjectService.createSubject(request, currentUser.getUserId()));
    }

    @Operation(summary = "Get all subjects")
    @PreAuthorize("isAuthenticated()")
    @GetMapping
    public ResponseData<List<SubjectResponse>> getAllSubjects() {
        log.info("Request get all subjects");
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved subject list successfully",
                subjectService.getAllSubjects());
    }

    @Operation(summary = "Get subject details by ID")
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{subjectId}")
    public ResponseData<SubjectResponse> getSubjectById(@PathVariable Long subjectId) {
        log.info("Request get subject id: {}", subjectId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved subject details successfully",
                subjectService.getSubjectById(subjectId));
    }

    @Operation(summary = "Get subjects by teacher ID")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @GetMapping("/teacher/{teacherId}")
    public ResponseData<List<SubjectResponse>> getSubjectsByTeacher(@PathVariable long teacherId) {
        log.info("Request get subjects by teacher id: {}", teacherId);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved subject list successfully",
                subjectService.getSubjectsByTeacher(teacherId));
    }

    @Operation(summary = "Update subject")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @PutMapping("/{subjectId}")
    public ResponseData<SubjectResponse> updateSubject(
            @PathVariable Long subjectId,
            @Valid @RequestBody SubjectRequest request) {
        log.info("Request update subject id: {}", subjectId);
        return new ResponseData<>(HttpStatus.OK.value(), "Subject updated successfully",
                subjectService.updateSubject(subjectId, request));
    }

    @Operation(summary = "Delete subject (soft delete)")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    @DeleteMapping("/{subjectId}")
    public ResponseData<Void> deleteSubject(@PathVariable Long subjectId) {
        log.info("Request delete subject id: {}", subjectId);
        subjectService.deleteSubject(subjectId);
        return new ResponseData<>(HttpStatus.OK.value(), "Subject deleted successfully");
    }
}
package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.SemesterRequest;
import com.fedu.fedu.dto.res.SemesterResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.service.SemesterService;
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
@RequestMapping("/admin/semesters")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SemesterController {

    private final SemesterService semesterService;

    @GetMapping
    public ResponseData<List<SemesterResponse>> getAllSemesters() {
        log.info("Request get all semesters");
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved semester list successfully",
                semesterService.getAllSemesters());
    }

    @PostMapping
    public ResponseData<SemesterResponse> createSemester(@Valid @RequestBody SemesterRequest request) {
        log.info("Request create semester: {} {}", request.getTerm(), request.getAcademicYear());
        return new ResponseData<>(HttpStatus.CREATED.value(), "Semester created successfully",
                semesterService.createSemester(request));
    }

    @PutMapping("/{id}")
    public ResponseData<SemesterResponse> updateSemester(
            @PathVariable Long id,
            @Valid @RequestBody SemesterRequest request) {
        log.info("Request update semester id: {}", id);
        return new ResponseData<>(HttpStatus.OK.value(), "Semester updated successfully",
                semesterService.updateSemester(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseData<Void> deleteSemester(@PathVariable Long id) {
        log.info("Request delete semester id: {}", id);
        semesterService.deleteSemester(id);
        return new ResponseData<>(HttpStatus.OK.value(), "Semester deleted successfully");
    }
}

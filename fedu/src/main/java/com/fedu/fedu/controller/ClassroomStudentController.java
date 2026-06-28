package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.res.ImportStudentsResult;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.StudentInClassResponse;
import com.fedu.fedu.service.ClassroomStudentService;
import com.fedu.fedu.service.ClassroomEnrollmentService;
import com.fedu.fedu.service.StudentImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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
    private final StudentImportService studentImportService;

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

    @Operation(summary = "Import sinh viên vào lớp-môn bằng file Excel (.xlsx)")
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseData<ImportStudentsResult> importStudents(
            @PathVariable Long classroomSubjectId,
            @RequestParam("file") MultipartFile file) {
        return new ResponseData<>(HttpStatus.OK.value(), "Import hoàn tất",
                studentImportService.importStudents(classroomSubjectId, file));
    }

    @Operation(summary = "Tải file Excel mẫu để import sinh viên")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/import/template")
    public ResponseEntity<byte[]> downloadImportTemplate(@PathVariable Long classroomSubjectId) {
        byte[] data = studentImportService.buildTemplate();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"student_import_template.xlsx\"")
                .contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(data);
    }
}

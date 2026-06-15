package com.fedu.fedu.controller.admin;

import com.fedu.fedu.dto.req.AddClassroomSubjectRequest;
import com.fedu.fedu.dto.req.ChangeLecturerRequest;
import com.fedu.fedu.dto.res.ClassroomGraphResponse;
import com.fedu.fedu.dto.res.ClassroomSubjectResponse;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.service.ClassroomSubjectService;
import com.fedu.fedu.service.LearningPathService;
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
@RequestMapping("/classrooms")
@RequiredArgsConstructor
@Tag(name = "Classroom Subject Controller", description = "Admin gán môn + giảng viên cho lớp (lớp-môn)")
public class ClassroomSubjectController {

    private final ClassroomSubjectService classroomSubjectService;
    private final LearningPathService learningPathService;

    @Operation(summary = "Gán 1 môn + giảng viên vào lớp")
    @PreAuthorize("hasRole('ADMIN')")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/{classroomId}/subjects")
    public ResponseData<ClassroomSubjectResponse> addSubject(
            @PathVariable Long classroomId,
            @Valid @RequestBody AddClassroomSubjectRequest req) {
        return new ResponseData<>(HttpStatus.CREATED.value(), "Đã gán môn vào lớp",
                classroomSubjectService.addSubjectToClassroom(classroomId, req));
    }

    @Operation(summary = "Danh sách các lớp-môn của 1 lớp")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/{classroomId}/subjects")
    public ResponseData<List<ClassroomSubjectResponse>> getSubjects(@PathVariable Long classroomId) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                classroomSubjectService.getSubjectsOfClassroom(classroomId));
    }

    @Operation(summary = "Danh sách các lớp-môn đang mở 1 môn (theo subjectId)")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/subjects/by-subject/{subjectId}")
    public ResponseData<List<ClassroomSubjectResponse>> getClassroomsBySubject(@PathVariable Long subjectId) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                classroomSubjectService.getClassroomsBySubject(subjectId));
    }

    @Operation(summary = "Danh sách lớp-môn mà 1 sinh viên đang học (theo studentId)")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/subjects/by-student/{studentId}")
    public ResponseData<List<ClassroomSubjectResponse>> getClassroomSubjectsByStudent(@PathVariable Long studentId) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                classroomSubjectService.getClassroomSubjectsByStudent(studentId));
    }

    @Operation(summary = "Xem lộ trình (graph) của 1 lớp-môn — read-only cho admin")
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/subjects/{classroomSubjectId}/graph")
    public ResponseData<ClassroomGraphResponse> getClassroomGraph(@PathVariable Long classroomSubjectId) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                learningPathService.getClassroomGraph(classroomSubjectId));
    }

    @Operation(summary = "Đổi giảng viên cho 1 lớp-môn")
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("/subjects/{classroomSubjectId}/lecturer")
    public ResponseData<ClassroomSubjectResponse> changeLecturer(
            @PathVariable Long classroomSubjectId,
            @Valid @RequestBody ChangeLecturerRequest req) {
        return new ResponseData<>(HttpStatus.OK.value(), "Đã đổi giảng viên",
                classroomSubjectService.changeLecturer(classroomSubjectId, req.getLecturerId()));
    }

    @Operation(summary = "Gỡ 1 môn khỏi lớp")
    @PreAuthorize("hasRole('ADMIN')")
    @DeleteMapping("/subjects/{classroomSubjectId}")
    public ResponseData<Void> removeSubject(@PathVariable Long classroomSubjectId) {
        classroomSubjectService.removeClassroomSubject(classroomSubjectId);
        return new ResponseData<>(HttpStatus.OK.value(), "Đã gỡ môn khỏi lớp");
    }
}
package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.SubMentorStudentAssignmentRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.SubMentorStudentAssignmentResponse;
import com.fedu.fedu.dto.res.SupportTicketResponse;
import com.fedu.fedu.dto.req.RespondTicketRequest;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.SubMentorService;
import com.fedu.fedu.service.SupportTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;






@Slf4j
@RestController
@RequestMapping("/teacher-manage/classroom-subjects/{classroomSubjectId}")
@RequiredArgsConstructor
@Tag(name = "Teacher Sub-Mentor & Ticket Controller", description = "Peer sub-mentor assignment and escalated ticket handling")
public class TeacherSubMentorController {

    private final SubMentorService subMentorService;
    private final SupportTicketService supportTicketService;

    

    @Operation(summary = "Bật cờ sub-mentor cho một học sinh trong lớp-môn")
    @PostMapping("/sub-mentors/{cssId}/enable")
    @ResponseStatus(HttpStatus.OK)
    public ResponseData<Void> enableSubMentor(
            @PathVariable Long classroomSubjectId,
            @PathVariable Long cssId,
            @AuthenticationPrincipal UserAccount currentUser) {
        subMentorService.enableSubMentor(classroomSubjectId, cssId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã bật cờ sub-mentor thành công");
    }

    @Operation(summary = "Tắt cờ sub-mentor cho một học sinh trong lớp-môn")
    @PostMapping("/sub-mentors/{cssId}/disable")
    @ResponseStatus(HttpStatus.OK)
    public ResponseData<Void> disableSubMentor(
            @PathVariable Long classroomSubjectId,
            @PathVariable Long cssId,
            @AuthenticationPrincipal UserAccount currentUser) {
        subMentorService.disableSubMentor(classroomSubjectId, cssId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã tắt cờ sub-mentor thành công");
    }

    

    @Operation(summary = "Danh sách tất cả assignment sub-mentor trong lớp-môn")
    @GetMapping("/assignments")
    public ResponseData<List<SubMentorStudentAssignmentResponse>> listAssignments(
            @PathVariable Long classroomSubjectId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                subMentorService.listAssignments(classroomSubjectId, currentUser.getUserId()));
    }

    @Operation(summary = "Tạo assignment: gán sub-mentor kèm học sinh")
    @PostMapping("/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseData<SubMentorStudentAssignmentResponse> createAssignment(
            @PathVariable Long classroomSubjectId,
            @Valid @RequestBody SubMentorStudentAssignmentRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.CREATED.value(), "Đã tạo assignment thành công",
                subMentorService.createAssignment(classroomSubjectId, request, currentUser.getUserId()));
    }

    @Operation(summary = "Xóa assignment sub-mentor")
    @DeleteMapping("/assignments/{assignmentId}")
    @ResponseStatus(HttpStatus.OK)
    public ResponseData<Void> deleteAssignment(
            @PathVariable Long classroomSubjectId,
            @PathVariable Long assignmentId,
            @AuthenticationPrincipal UserAccount currentUser) {
        subMentorService.deleteAssignment(classroomSubjectId, assignmentId, currentUser.getUserId());
        return new ResponseData<>(HttpStatus.OK.value(), "Đã xóa assignment thành công");
    }

    

    @Operation(summary = "Danh sách ticket SEND (leo thang) của lớp-môn")
    @GetMapping("/tickets/escalated")
    public ResponseData<List<SupportTicketResponse>> listEscalatedTickets(
            @PathVariable Long classroomSubjectId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                supportTicketService.listEscalatedTickets(classroomSubjectId, currentUser.getUserId()));
    }

    @Operation(summary = "Giảng viên trả lời ticket SEND → DONE")
    @PutMapping("/tickets/{ticketId}/respond")
    @ResponseStatus(HttpStatus.OK)
    public ResponseData<SupportTicketResponse> respondAsTeacher(
            @PathVariable Long classroomSubjectId,
            @PathVariable Long ticketId,
            @Valid @RequestBody RespondTicketRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Đã trả lời ticket thành công",
                supportTicketService.respondAsTeacher(ticketId, request, currentUser.getUserId()));
    }
}

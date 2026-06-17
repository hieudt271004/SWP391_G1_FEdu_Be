package com.fedu.fedu.controller.teacher;

import com.fedu.fedu.dto.req.TicketAnswerRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.SupportTicketDetailResponse;
import com.fedu.fedu.dto.res.SupportTicketResponse;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.service.TeacherTicketService;
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
@RequestMapping("/teacher-manage")
@RequiredArgsConstructor
@Tag(name = "Teacher Ticket Controller", description = "Endpoints for teachers to manage student support tickets")
public class TeacherTicketController {

    private final TeacherTicketService teacherTicketService;

    @Operation(summary = "Get list of escalated support tickets for teacher")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/tickets")
    public ResponseData<List<SupportTicketResponse>> getLecturerTickets(@AuthenticationPrincipal UserAccount lecturer) {
        log.info("Teacher request get tickets for teacher user id: {}", lecturer.getUserId());
        List<SupportTicketResponse> tickets = teacherTicketService.getLecturerTickets(lecturer);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved support tickets successfully", tickets);
    }

    @Operation(summary = "Get support ticket detail (Teacher)")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @GetMapping("/tickets/{ticketId}")
    public ResponseData<SupportTicketDetailResponse> getTicketDetail(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserAccount lecturer) {
        log.info("Teacher request get ticket detail for ticket id: {}", ticketId);
        SupportTicketDetailResponse detail = teacherTicketService.getTicketDetail(ticketId, lecturer);
        return new ResponseData<>(HttpStatus.OK.value(), "Retrieved support ticket detail successfully", detail);
    }

    @Operation(summary = "Answer support ticket (Teacher)")
    @PreAuthorize("hasAuthority('ROLE_TEACHER')")
    @PostMapping("/tickets/{ticketId}/answer")
    public ResponseData<Void> answerTicket(
            @PathVariable Long ticketId,
            @Valid @RequestBody TicketAnswerRequest request,
            @AuthenticationPrincipal UserAccount lecturer) {
        log.info("Teacher answering ticket id: {}", ticketId);
        teacherTicketService.answerTicket(ticketId, request, lecturer);
        return new ResponseData<>(HttpStatus.OK.value(), "Answered support ticket successfully");
    }
}

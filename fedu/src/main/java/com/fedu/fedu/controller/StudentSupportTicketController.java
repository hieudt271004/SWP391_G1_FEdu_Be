package com.fedu.fedu.controller;

import com.fedu.fedu.dto.req.CreateSupportTicketRequest;
import com.fedu.fedu.dto.req.RespondTicketRequest;
import com.fedu.fedu.dto.res.ResponseData;
import com.fedu.fedu.dto.res.SupportTicketResponse;
import com.fedu.fedu.entity.UserAccount;
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
@RequestMapping("/student/support-tickets")
@RequiredArgsConstructor
@Tag(name = "Student Support Ticket Controller", description = "Peer-mentoring support ticket: student create, sub-mentor respond/escalate")
public class StudentSupportTicketController {

    private final SupportTicketService supportTicketService;

    

    @Operation(summary = "Học sinh tạo ticket hỗ trợ trong lớp-môn đã ghi danh")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ResponseData<SupportTicketResponse> createTicket(
            @Valid @RequestBody CreateSupportTicketRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.CREATED.value(), "Đã gửi câu hỏi thành công",
                supportTicketService.createTicket(request, currentUser.getUserId()));
    }

    @Operation(summary = "Học sinh xem danh sách câu hỏi hỗ trợ của mình trong lớp-môn")
    @GetMapping
    public ResponseData<List<SupportTicketResponse>> listMyTickets(
            @RequestParam Long classroomSubjectId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                supportTicketService.listMyTickets(currentUser.getUserId(), classroomSubjectId));
    }

    

    @Operation(summary = "Sub-mentor xem danh sách ticket cần xử lý trong lớp-môn")
    @GetMapping("/assigned")
    public ResponseData<List<SupportTicketResponse>> listAssignedTickets(
            @RequestParam Long classroomSubjectId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "OK",
                supportTicketService.listAssignedTickets(currentUser.getUserId(), classroomSubjectId));
    }

    @Operation(summary = "Sub-mentor trả lời ticket → DONE")
    @PutMapping("/{ticketId}/respond")
    @ResponseStatus(HttpStatus.OK)
    public ResponseData<SupportTicketResponse> respond(
            @PathVariable Long ticketId,
            @Valid @RequestBody RespondTicketRequest request,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Đã trả lời ticket thành công",
                supportTicketService.respond(ticketId, request, currentUser.getUserId()));
    }

    @Operation(summary = "Sub-mentor leo thang ticket lên giảng viên → SEND")
    @PostMapping("/{ticketId}/escalate")
    @ResponseStatus(HttpStatus.OK)
    public ResponseData<SupportTicketResponse> escalate(
            @PathVariable Long ticketId,
            @AuthenticationPrincipal UserAccount currentUser) {
        return new ResponseData<>(HttpStatus.OK.value(), "Đã leo thang ticket lên giảng viên",
                supportTicketService.escalate(ticketId, currentUser.getUserId()));
    }
}

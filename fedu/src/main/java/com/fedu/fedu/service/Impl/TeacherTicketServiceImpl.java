package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.TicketAnswerRequest;
import com.fedu.fedu.dto.res.SupportTicketDetailResponse;
import com.fedu.fedu.dto.res.SupportTicketResponse;
import com.fedu.fedu.dto.res.TicketCommentResponse;
import com.fedu.fedu.entity.SupportTicket;
import com.fedu.fedu.entity.TicketComment;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.SupportTicketRepository;
import com.fedu.fedu.repository.TicketCommentRepository;
import com.fedu.fedu.service.TeacherTicketService;
import com.fedu.fedu.utils.enums.TicketLevel;
import com.fedu.fedu.utils.enums.TicketStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherTicketServiceImpl implements TeacherTicketService {

    private final SupportTicketRepository supportTicketRepository;
    private final TicketCommentRepository ticketCommentRepository;

    @Override
    @Transactional(readOnly = true)
    public List<SupportTicketResponse> getLecturerTickets(UserAccount lecturer) {
        log.info("Fetching support tickets for lecturer userId: {}", lecturer.getUserId());
        List<SupportTicket> tickets = supportTicketRepository.findLecturerTickets(lecturer.getUserId(), TicketLevel.LECTURER);
        
        return tickets.stream()
                .map(this::mapToTicketResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public SupportTicketDetailResponse getTicketDetail(Long ticketId, UserAccount lecturer) {
        log.info("Fetching support ticket detail for ticketId: {} and lecturer userId: {}", ticketId, lecturer.getUserId());
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found with id: " + ticketId));

        // Check ownership/permissions
        if (ticket.getClassroomSubject().getLecturer().getUserId() != lecturer.getUserId()) {
            throw new AccessDeniedException("You are not authorized to view this support ticket");
        }

        List<TicketComment> comments = ticketCommentRepository.findBySupportTicketTicketIdOrderByCreatedAtAsc(ticketId);
        List<TicketCommentResponse> commentResponses = comments.stream()
                .map(this::mapToCommentResponse)
                .collect(Collectors.toList());

        return SupportTicketDetailResponse.builder()
                .ticketId(ticket.getTicketId())
                .title(ticket.getTitle())
                .description(ticket.getDescription())
                .status(ticket.getStatus())
                .studentName(getFullName(ticket.getCreatedBy()))
                .studentEmail(ticket.getCreatedBy().getEmail())
                .className(ticket.getClassroomSubject().getClassroom().getClassName())
                .subjectName(ticket.getClassroomSubject().getSubject().getSubjectName())
                .comments(commentResponses)
                .createdAt(ticket.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public void answerTicket(Long ticketId, TicketAnswerRequest request, UserAccount lecturer) {
        log.info("Lecturer userId: {} is answering ticketId: {}", lecturer.getUserId(), ticketId);
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Support ticket not found with id: " + ticketId));

        // Check ownership/permissions
        if (ticket.getClassroomSubject().getLecturer().getUserId() != lecturer.getUserId()) {
            throw new AccessDeniedException("You are not authorized to answer this support ticket");
        }

        // 1. Update ticket status to RESOLVED (and set assignedTo to the lecturer if not set)
        ticket.setStatus(TicketStatus.RESOLVED);
        if (ticket.getAssignedTo() == null) {
            ticket.setAssignedTo(lecturer);
        }
        supportTicketRepository.save(ticket);

        // 2. Save the answer as a comment
        TicketComment comment = TicketComment.builder()
                .supportTicket(ticket)
                .userAccount(lecturer)
                .content(request.getContent())
                .build();
        ticketCommentRepository.save(comment);
    }

    private SupportTicketResponse mapToTicketResponse(SupportTicket st) {
        return SupportTicketResponse.builder()
                .ticketId(st.getTicketId())
                .title(st.getTitle())
                .description(st.getDescription())
                .status(st.getStatus())
                .studentName(getFullName(st.getCreatedBy()))
                .studentEmail(st.getCreatedBy().getEmail())
                .className(st.getClassroomSubject().getClassroom().getClassName())
                .subjectName(st.getClassroomSubject().getSubject().getSubjectName())
                .createdAt(st.getCreatedAt())
                .build();
    }

    private TicketCommentResponse mapToCommentResponse(TicketComment c) {
        return TicketCommentResponse.builder()
                .commentId(c.getCommentId())
                .commenterName(getFullName(c.getUserAccount()))
                .commenterEmail(c.getUserAccount().getEmail())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private String getFullName(UserAccount user) {
        if (user == null) return "Quản trị viên";
        String first = user.getFirstName() != null ? user.getFirstName() : "";
        String last = user.getLastName() != null ? user.getLastName() : "";
        return (last + " " + first).trim();
    }
}

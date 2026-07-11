package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.CreateSupportTicketRequest;
import com.fedu.fedu.dto.req.RespondTicketRequest;
import com.fedu.fedu.dto.res.SupportTicketResponse;

import java.util.List;





public interface SupportTicketService {

    

    






    SupportTicketResponse createTicket(CreateSupportTicketRequest request, Long studentUserId);

    






    List<SupportTicketResponse> listMyTickets(Long studentUserId, Long classroomSubjectId);

    

    






    List<SupportTicketResponse> listAssignedTickets(Long subMentorUserId, Long classroomSubjectId);

    






    SupportTicketResponse respond(Long ticketId, RespondTicketRequest request, Long subMentorUserId);

    






    SupportTicketResponse escalate(Long ticketId, Long subMentorUserId);

    

    





    List<SupportTicketResponse> listEscalatedTickets(Long classroomSubjectId, Long lecturerId);

    






    SupportTicketResponse respondAsTeacher(Long ticketId, RespondTicketRequest request, Long lecturerId);
}

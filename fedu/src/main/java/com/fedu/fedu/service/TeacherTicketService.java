package com.fedu.fedu.service;

import com.fedu.fedu.dto.req.TicketAnswerRequest;
import com.fedu.fedu.dto.res.SupportTicketDetailResponse;
import com.fedu.fedu.dto.res.SupportTicketResponse;
import com.fedu.fedu.entity.UserAccount;

import java.util.List;

public interface TeacherTicketService {
    List<SupportTicketResponse> getLecturerTickets(UserAccount lecturer);
    SupportTicketDetailResponse getTicketDetail(Long ticketId, UserAccount lecturer);
    void answerTicket(Long ticketId, TicketAnswerRequest request, UserAccount lecturer);
}

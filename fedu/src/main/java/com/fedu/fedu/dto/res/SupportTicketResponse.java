package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.SupportTicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;




@Data
@Builder
public class SupportTicketResponse {

    private Long ticketId;

    
    private Long classroomSubjectStudentId;

    
    private String studentName;

    
    private String studentEmail;

    
    private String messageStudent;

    
    private String messageResponse;

    
    private SupportTicketStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

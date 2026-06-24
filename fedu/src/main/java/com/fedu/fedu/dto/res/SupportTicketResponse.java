package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.TicketStatus;
import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketResponse {
    private Long ticketId;
    private String title;
    private String description;
    private TicketStatus status;
    private String studentName;
    private String studentEmail;
    private String className;
    private String subjectName;
    private LocalDateTime createdAt;
}

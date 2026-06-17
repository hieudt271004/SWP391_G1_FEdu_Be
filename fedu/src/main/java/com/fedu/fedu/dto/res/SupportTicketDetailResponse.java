package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.TicketStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportTicketDetailResponse {
    private Long ticketId;
    private String title;
    private String description;
    private TicketStatus status;
    private String studentName;
    private String studentEmail;
    private String className;
    private String subjectName;
    private List<TicketCommentResponse> comments;
    private LocalDateTime createdAt;
}

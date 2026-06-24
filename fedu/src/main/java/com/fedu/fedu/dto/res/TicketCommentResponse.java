package com.fedu.fedu.dto.res;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketCommentResponse {
    private Long commentId;
    private String commenterName;
    private String commenterEmail;
    private String content;
    private LocalDateTime createdAt;
}

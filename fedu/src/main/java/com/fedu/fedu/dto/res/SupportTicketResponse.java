package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.SupportTicketStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * Phản hồi thông tin một support ticket. Không lộ entity.
 */
@Data
@Builder
public class SupportTicketResponse {

    private Long ticketId;

    /** ID của ClassroomSubjectStudent (người hỏi). */
    private Long classroomSubjectStudentId;

    /** Tên hiển thị của học sinh đặt câu hỏi. */
    private String studentName;

    /** Email của học sinh đặt câu hỏi. */
    private String studentEmail;

    /** Nội dung câu hỏi. */
    private String messageStudent;

    /** Câu trả lời (null nếu chưa trả lời). */
    private String messageResponse;

    /** Trạng thái: NONE / DONE / SEND. */
    private SupportTicketStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

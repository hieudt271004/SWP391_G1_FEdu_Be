package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.SupportTicketStatus;
import jakarta.persistence.*;
import lombok.*;

/**
 * Ticket hỗ trợ theo mô hình peer-mentoring.
 * Học sinh gửi câu hỏi → sub-mentor trả lời (DONE) hoặc leo thang lên giảng viên (SEND)
 * → giảng viên xử lý (DONE).
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "support_tickets")
public class SupportTicket extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ticket_id")
    private Long ticketId;

    /** CSS của học sinh tạo câu hỏi (đã ghi danh lớp-môn). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_student_id", nullable = false)
    private ClassroomSubjectStudent classroomSubjectStudent;

    /** Nội dung câu hỏi từ học sinh. */
    @Column(name = "message_student", nullable = false, columnDefinition = "TEXT")
    private String messageStudent;

    /** Câu trả lời từ sub-mentor hoặc giảng viên (1 ô duy nhất, ghi đè nếu leo thang). */
    @Column(name = "message_response", columnDefinition = "TEXT")
    private String messageResponse;

    /** Trạng thái: NONE (mới), SEND (leo thang lên giảng viên), DONE (đã giải quyết). */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SupportTicketStatus status = SupportTicketStatus.NONE;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}

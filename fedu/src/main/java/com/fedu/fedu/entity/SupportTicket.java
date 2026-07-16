package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.SupportTicketStatus;
import jakarta.persistence.*;
import lombok.*;






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

    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_student_id", nullable = false)
    private ClassroomSubjectStudent classroomSubjectStudent;

    
    @Column(name = "message_student", nullable = false, columnDefinition = "TEXT")
    private String messageStudent;

    
    @Column(name = "message_response", columnDefinition = "TEXT")
    private String messageResponse;

    
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SupportTicketStatus status = SupportTicketStatus.NONE;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}

package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Ánh xạ tự tham chiếu trên ClassroomSubjectStudent:
 * một sub-mentor (CSS với isSubmentor=true) phụ trách kèm một học sinh (CSS khác)
 * trong cùng lớp-môn.
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(
    name = "sub_mentor_student_assignment",
    uniqueConstraints = @UniqueConstraint(columnNames = {"sub_mentor_css_id", "student_css_id"})
)
public class SubMentorStudentAssignment extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** CSS của học sinh đóng vai sub-mentor (isSubmentor = true). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_mentor_css_id", nullable = false)
    private ClassroomSubjectStudent subMentorCss;

    /** CSS của học sinh được kèm bởi sub-mentor trên. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_css_id", nullable = false)
    private ClassroomSubjectStudent studentCss;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime assignedAt;
}

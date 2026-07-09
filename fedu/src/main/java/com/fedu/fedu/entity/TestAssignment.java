package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.PopQuizAssignmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lượt giao bài kiểm tra ad-hoc (pop quiz) của giáo viên cho một nhóm học sinh
 * trong một buổi ON_CLASS. Không thuộc lộ trình học (learning path) — chỉ tham
 * chiếu node để scope polling và classroom-subject để scope quyền giáo viên.
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "test_assignments")
public class TestAssignment extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "assignment_id")
    private Long assignmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private LearningNode node;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_id", nullable = false)
    private ClassroomSubject classroomSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_by", nullable = false)
    private UserAccount assignedBy;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PopQuizAssignmentStatus status = PopQuizAssignmentStatus.OPEN;

    /** Tự đóng khi quá giờ này (lazy, không scheduler); null = chỉ đóng thủ công. */
    @Column(name = "close_at")
    private LocalDateTime closeAt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}

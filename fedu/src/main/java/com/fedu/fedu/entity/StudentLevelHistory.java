package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.LevelChangeReason;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Lịch sử thay đổi mức năng lực của học sinh trong một lớp-môn.
 * oldLevel null = lần phân loại đầu tiên (PLACEMENT).
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "student_level_history")
public class StudentLevelHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserAccount student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_id", nullable = false)
    private ClassroomSubject classroomSubject;

    /** Mức cũ; null cho lần phân loại đầu tiên. */
    @Column(name = "old_level")
    private Integer oldLevel;

    @Column(name = "new_level", nullable = false)
    private Integer newLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "reason", nullable = false)
    private LevelChangeReason reason;

    @Column(name = "changed_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime changedAt;
}

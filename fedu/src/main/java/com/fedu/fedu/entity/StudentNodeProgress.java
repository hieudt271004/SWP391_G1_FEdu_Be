package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "student_node_progress", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "node_id"})
})
public class StudentNodeProgress extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long progressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserAccount student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private LearningNode learningNode;

    @Column(name = "is_completed")
    private Boolean isCompleted = false;

    @Column(name = "unlocked_at")
    private LocalDateTime unlockedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}

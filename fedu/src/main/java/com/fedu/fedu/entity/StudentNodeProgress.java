package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.StudentProgressStatus;
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
        @UniqueConstraint(columnNames = {"classroom_subject_student_id", "node_id", "path_id"})
})
public class StudentNodeProgress extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long progressId;

    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_student_id", nullable = false)
    private ClassroomSubjectStudent classroomSubjectStudent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private LearningNode learningNode;

    



    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id", nullable = false)
    private LearningPath learningPath;

    



    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    



    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StudentProgressStatus status = StudentProgressStatus.LOCKED;

    @Column(name = "unlocked_at")
    private LocalDateTime unlockedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    
    @Builder.Default
    @Column(name = "completed_late")
    private Boolean completedLate = false;
}

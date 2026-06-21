package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "classroom_subject_students", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"classroom_subject_id", "student_id"})
})
public class ClassroomSubjectStudent extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_id", nullable = false)
    private ClassroomSubject classroomSubject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserAccount student;

    @Column(name = "joined_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime joinedAt;

    /** Mức đang học: null = chưa làm placement quiz (bị chặn học); 1=yếu, 2=tb, 3=khá. */
    @Column(name = "current_level")
    private Integer currentLevel;

    /**
     * Model A: lộ trình clone học sinh được gán sau placement (null = chưa phân loại).
     * Đây là nguồn sự thật để định tuyến học sinh, thay cho lọc node theo currentLevel.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_path_id")
    private LearningPath assignedPath;
}

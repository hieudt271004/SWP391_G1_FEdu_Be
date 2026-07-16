package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.PopQuizStudentStatus;
import jakarta.persistence.*;
import lombok.*;






@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "test_assignment_students", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"assignment_id", "classroom_subject_student_id"})
})
public class TestAssignmentStudent extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private TestAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_student_id", nullable = false)
    private ClassroomSubjectStudent classroomSubjectStudent;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PopQuizStudentStatus status = PopQuizStudentStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id")
    private StudentTestAttempt attempt;

    @Builder.Default
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
}

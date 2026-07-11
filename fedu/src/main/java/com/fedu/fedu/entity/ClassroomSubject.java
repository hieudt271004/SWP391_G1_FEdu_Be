package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;





@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "classroom_subjects", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"classroom_id", "subject_id"})
})
public class ClassroomSubject extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id", nullable = false)
    private Subject subject;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private UserAccount lecturer;

    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_quiz_start")
    private Test quizStart;
}

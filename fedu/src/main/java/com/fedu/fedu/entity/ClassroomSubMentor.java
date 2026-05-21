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
@Table(name = "classroom_sub_mentor", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"classroom_id", "sub_mentor_id"})
})
public class ClassroomSubMentor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sub_mentor_id", nullable = false)
    private UserAccount subMentor;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    @CreationTimestamp
    private LocalDateTime assignedAt;
}

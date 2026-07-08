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
@Table(name = "student_material_progress", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"classroom_subject_student_id", "material_id"})
})
public class StudentMaterialProgress implements java.io.Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "progress_id")
    private Long progressId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_student_id", nullable = false)
    private ClassroomSubjectStudent classroomSubjectStudent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "material_id", nullable = false)
    private NodeMaterial material;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}

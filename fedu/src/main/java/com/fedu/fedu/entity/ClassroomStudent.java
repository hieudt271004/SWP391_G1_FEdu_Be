package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.AbsentStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;


@Entity
@Table(name = "classroom_student")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomStudent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "clasroom_student_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    @Column(name = "joined_date")
    private LocalDate joinedDate;

    @Enumerated(EnumType.STRING)
    private AbsentStatus status;
}
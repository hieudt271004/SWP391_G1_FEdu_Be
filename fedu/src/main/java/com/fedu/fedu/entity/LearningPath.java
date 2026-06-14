package com.fedu.fedu.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Lộ trình học tập.
 classroomSubject != null && originalPath != null ⇒ bản clone cho 1 lớp-môn
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "learning_paths")
public class LearningPath extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "path_id")
    private Long pathId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subject_id")
    private Subject subject;

    @Column(name = "path_name", nullable = false)
    private String pathName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private UserAccount createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_subject_id")
    private ClassroomSubject classroomSubject;   // null = template; có giá trị = bản clone của lớp-môn

    @Enumerated(EnumType.STRING)
    @Column(name = "level")
    private com.fedu.fedu.utils.enums.LearningPathLevel level;  // chỉ set cho template

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_path_id")
    private LearningPath originalPath;

    @Column(name = "published_at")
    private java.time.LocalDateTime publishedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by")
    private UserAccount publishedBy;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}

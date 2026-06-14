package com.fedu.fedu.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

/**
 * Lộ trình học tập.
 *
 * - Nếu classroom != null và originalPath != null: đây là bản lộ trình được clone riêng cho 1 lớp học
 *   (trước đây là ClassroomLearningPath).
 * - Nếu classroom == null: đây là lộ trình mẫu (template) cho một môn học.
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

    /**
     * Lớp học sở hữu lộ trình này (nullable).
     * Nếu có giá trị => đây là lộ trình riêng của lớp học đó (clone từ originalPath).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "classroom_id")
    private Classroom classroom;

    /**
     * Lộ trình gốc (template) được dùng làm nguồn khi clone (nullable).
     * Chỉ có giá trị khi đây là bản clone cho lớp học.
     */
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

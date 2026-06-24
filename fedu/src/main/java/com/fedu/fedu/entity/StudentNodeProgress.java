package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.StudentProgressStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Lưu trữ tiến trình học tập và lộ trình (routing) của từng học sinh.
 *
 * - status:       tiến độ học của node đó (LOCKED / OPEN / IN_PROGRESS / COMPLETED)
 * - orderIndex:   thứ tự bài học trong lộ trình – dùng để route (điều hướng)
 * - status:       tiến độ học của node đó (LOCKED / OPEN / IN_PROGRESS / COMPLETED)
 *
 * UniqueConstraint (student_id, node_id, path_id):
 *   Đảm bảo 1 học sinh chỉ có 1 bản ghi progress cho mỗi (node, path).
 *   Tránh trùng khi học sinh học cùng node nhưng ở 2 lớp khác nhau.
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "student_node_progress", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"student_id", "node_id", "path_id"})
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

    /**
     * Lộ trình học cụ thể mà bản ghi progress này thuộc về.
     * Cần thiết để phân biệt cùng 1 node nhưng ở các lớp/lộ trình khác nhau.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "path_id", nullable = false)
    private LearningPath learningPath;

    /**
     * Thứ tự bài học trong lộ trình (dùng để routing).
     * Xác định học sinh phải học node này ở vị trí thứ mấy.
     */
    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    /**
     * Trạng thái học của node:
     * LOCKED – chưa mở, OPEN – đang mở/có thể học, IN_PROGRESS – đang học, COMPLETED – đã hoàn thành.
     */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private StudentProgressStatus status = StudentProgressStatus.LOCKED;

    /**
     * Test của node bị khóa tạm thời: node đang OPEN nhưng học sinh phải hoàn thành
     * nhánh phụ (làm lại) rồi mới được làm/làm lại test ở node này.
     */
    @Builder.Default
    @Column(name = "test_locked", nullable = false)
    private Boolean testLocked = false;

    @Column(name = "unlocked_at")
    private LocalDateTime unlockedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}

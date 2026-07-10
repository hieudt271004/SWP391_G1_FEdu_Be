package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.TestKind;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "tests")
public class Test extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "test_id")
    private Long testId;

    /** null = quiz phân loại (placement) — không gắn vào node học nào. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id")
    private LearningNode learningNode;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    /** Điểm đậu tính theo %. Ví dụ: 50.00 = 50% */
    @Column(name = "passing_percentage", precision = 5, scale = 2)
    private BigDecimal passingPercentage;

    @Column(name = "order_index")
    private Integer orderIndex;

    /**
     * Thời điểm phát đề cho học sinh. null = đề đã soạn nhưng CHƯA phát (ẩn với học sinh).
     * Test tạo ngoài buổi live được phát ngay lúc tạo (giữ hành vi cũ).
     */
    @Column(name = "released_at")
    private java.time.LocalDateTime releasedAt;

    /**
     * Hạn nộp CHUNG cả lớp (= lúc phát đề + durationMinutes), chỉ set khi teacher bấm
     * "Phát đề" trong buổi học live. null = đề thường, không giới hạn giờ chung.
     */
    @Column(name = "release_ends_at")
    private java.time.LocalDateTime releaseEndsAt;

    /** NORMAL = test thường; POP_QUIZ = bài giao ad-hoc, bị chặn ở endpoint test generic. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "test_kind", nullable = false)
    private TestKind testKind = TestKind.NORMAL;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}

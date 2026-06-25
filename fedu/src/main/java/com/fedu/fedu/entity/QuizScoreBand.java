package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Khoảng điểm của một bài quiz (placement hoặc cổng test), do giảng viên cấu hình.
 * Điểm rơi vào [minScore, maxScore] → gán targetLevel (1=yếu, 2=tb, 3=khá).
 * Các band của cùng một quiz phải phủ kín dải điểm và không chồng lấn.
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "quiz_score_bands")
public class QuizScoreBand extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "band_id")
    private Long bandId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(name = "min_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal minScore;

    @Column(name = "max_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal maxScore;

    /** Mức mục tiêu khi điểm rơi vào band này: 1=yếu, 2=tb, 3=khá. */
    @Column(name = "target_level", nullable = false)
    private Integer targetLevel;
}

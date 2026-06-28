package com.fedu.fedu.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "student_test_attempts")
public class StudentTestAttempt extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attempt_id")
    private Long attemptId;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserAccount student;

    /** Điểm tổng của lần thi (null khi chưa nộp/chưa chấm xong) */
    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    /** Trạng thái lượt làm bài (placement cancel/retake). Mặc định SUBMITTED cho dữ liệu cũ. */
    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private com.fedu.fedu.utils.enums.AttemptStatus status = com.fedu.fedu.utils.enums.AttemptStatus.SUBMITTED;

    /** Số lần học sinh rời khỏi tab khi đang làm bài (chống gian lận). */
    @Builder.Default
    @Column(name = "tab_out_count")
    private Integer tabOutCount = 0;
    // created_at và updated_at kế thừa từ AbstractEntity
}

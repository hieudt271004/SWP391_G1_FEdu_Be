package com.fedu.fedu.entity;

import com.fedu.fedu.utils.enums.QuestionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "test_questions")
public class TestQuestion extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "question_id")
    private Long questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;

    @Column(name = "question_content", nullable = false, columnDefinition = "TEXT")
    private String questionContent;

    /**
     * Loại câu hỏi:
     * - MULTIPLE_CHOICE: trắc nghiệm 1 đáp án đúng
     * - MULTIPLE_SELECT: trắc nghiệm nhiều đáp án đúng
     * - TRUE_FALSE: đúng/sai
     * - SHORT_ANSWER: trả lời ngắn
     * - ESSAY: tự luận
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false)
    private QuestionType questionType = QuestionType.MULTIPLE_CHOICE;

    @Column(name = "score", precision = 5, scale = 2)
    private BigDecimal score = BigDecimal.ONE;
}

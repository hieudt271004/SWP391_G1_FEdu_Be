package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Lưu trữ câu trả lời cụ thể của học sinh cho từng câu hỏi trong một lần thi.
 *
 * Hỗ trợ đầy đủ tất cả loại câu hỏi:
 *
 * - MULTIPLE_CHOICE / TRUE_FALSE:
 *     Dùng selectedAnswer (1 đáp án duy nhất)
 *
 * - MULTIPLE_SELECT:
 *     Dùng selectedAnswers (danh sách nhiều đáp án)
 *     Lưu qua bảng phụ student_selected_answers (join table)
 *
 * - SHORT_ANSWER / ESSAY:
 *     Dùng responseText (trả lời văn bản tự do)
 *     isCorrect = null cho ESSAY (giảng viên chấm thủ công)
 */
@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "student_test_responses", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"attempt_id", "question_id"})
})
public class StudentTestResponse extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "response_id")
    private Long responseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private StudentTestAttempt studentTestAttempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private TestQuestion testQuestion;

    /**
     * Đáp án học sinh chọn – dùng cho MULTIPLE_CHOICE và TRUE_FALSE (chỉ 1 đáp án).
     * Null nếu là câu MULTIPLE_SELECT hoặc câu tự luận.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_answer_id")
    private TestAnswer selectedAnswer;

    /**
     * Danh sách các đáp án học sinh chọn – dùng cho MULTIPLE_SELECT (nhiều đáp án).
     * Lưu qua bảng phụ student_selected_answers để tránh vi phạm 1NF.
     * Rỗng nếu là MULTIPLE_CHOICE, TRUE_FALSE, hoặc câu tự luận.
     */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "student_selected_answers",
            joinColumns = @JoinColumn(name = "response_id"),
            inverseJoinColumns = @JoinColumn(name = "answer_id")
    )
    @Builder.Default
    private List<TestAnswer> selectedAnswers = new ArrayList<>();

    /**
     * Nội dung trả lời tự luận – dùng cho SHORT_ANSWER và ESSAY.
     * Null nếu là câu trắc nghiệm.
     */
    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    /**
     * Kết quả đúng/sai của câu trả lời (hệ thống tự tính khi nộp bài).
     * null cho câu ESSAY (giảng viên chấm thủ công).
     */
    @Column(name = "is_correct")
    private Boolean isCorrect;
}

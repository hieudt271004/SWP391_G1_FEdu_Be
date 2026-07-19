package com.fedu.fedu.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "selected_answer_id")
    private TestAnswer selectedAnswer;

    




    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "student_selected_answers",
            joinColumns = @JoinColumn(name = "response_id"),
            inverseJoinColumns = @JoinColumn(name = "answer_id")
    )
    @Builder.Default
    private List<TestAnswer> selectedAnswers = new ArrayList<>();

    



    @Column(name = "response_text", columnDefinition = "TEXT")
    private String responseText;

    



    @Column(name = "is_correct")
    private Boolean isCorrect;
}

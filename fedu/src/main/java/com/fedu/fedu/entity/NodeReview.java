package com.fedu.fedu.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "node_reviews")
public class NodeReview extends AbstractEntity<Long> {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id", nullable = false)
    private LearningNode learningNode;

    /**
     * Tác giả của đánh giá/nhận xét/phản hồi.
     * Tên cột dưới database giữ nguyên là student_id nhưng trường này có thể là Student, Sub-mentor, hoặc Teacher.
     *
     * Phân loại bản ghi:
     * - Đánh giá gốc (Rated Root/Review): parentReview == null && rating != null
     * - Thảo luận gốc (Comment Root): parentReview == null && rating == null
     * - Phản hồi (Reply): parentReview != null (rating == null)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private UserAccount author;

    /** Review cha (null nếu đây là review gốc, có giá trị nếu đây là reply). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_review_id")
    private NodeReview parentReview;

    /** Danh sách reply trực tiếp của review này. */
    @Builder.Default
    @OneToMany(mappedBy = "parentReview", fetch = FetchType.LAZY)
    private List<NodeReview> replies = new ArrayList<>();

    @Min(1)
    @Max(5)
    @Column(name = "rating")
    private Integer rating;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;
}

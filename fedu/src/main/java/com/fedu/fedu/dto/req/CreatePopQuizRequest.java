package com.fedu.fedu.dto.req;

import com.fedu.fedu.utils.enums.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Yêu cầu giáo viên giao pop quiz cho một danh sách học sinh trong buổi ON_CLASS.
 * Đề lấy từ ĐÚNG MỘT trong hai nguồn: {@code questions} (soạn inline) hoặc {@code existingTestId}
 * (chọn test có sẵn). Validate per-type câu hỏi (MC/TF đúng 1 đáp án đúng, MS ≥ 1, chỉ nhận loại
 * auto-gradable) được thực hiện ở service vì cần logic theo enum, không chỉ bean validation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePopQuizRequest {

    @NotBlank(message = "Tiêu đề không được để trống")
    private String title;

    /**
     * Bắt buộc và validate 1..180 khi soạn đề inline (dùng để tạo Test mới).
     * Bị bỏ qua khi dùng existingTestId — thời gian lấy từ durationMinutes của test có sẵn.
     * Requiredness phụ thuộc nguồn đề nên validate ở service, không phải bean validation.
     */
    private Integer durationMinutes;

    /** null = chỉ đóng thủ công. */
    private LocalDateTime closeAt;

    @NotEmpty(message = "Phải chọn ít nhất 1 học sinh")
    private List<Long> studentIds;

    /** Nguồn đề 1: soạn inline. */
    @Size(max = 50, message = "Tối đa 50 câu hỏi")
    @Valid
    private List<QuestionInput> questions;

    /** Nguồn đề 2: chọn test có sẵn. */
    private Long existingTestId;

    @AssertTrue(message = "Phải cung cấp đúng một nguồn đề: questions hoặc existingTestId")
    public boolean isExactlyOneQuestionSource() {
        boolean hasInline = questions != null && !questions.isEmpty();
        boolean hasExisting = existingTestId != null;
        return hasInline ^ hasExisting;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionInput {
        @NotBlank(message = "Nội dung câu hỏi không được để trống")
        private String questionContent;

        @NotNull(message = "Loại câu hỏi là bắt buộc")
        private QuestionType questionType;

        private BigDecimal score;

        @NotEmpty(message = "Câu hỏi phải có ít nhất 1 đáp án")
        @Size(max = 10, message = "Tối đa 10 đáp án mỗi câu hỏi")
        @Valid
        private List<AnswerInput> answers;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerInput {
        @NotBlank(message = "Nội dung đáp án không được để trống")
        private String answerContent;

        @NotNull(message = "isCorrect là bắt buộc")
        private Boolean isCorrect;
    }
}

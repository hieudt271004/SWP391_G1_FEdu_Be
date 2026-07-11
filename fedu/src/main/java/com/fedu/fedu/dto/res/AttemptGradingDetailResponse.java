package com.fedu.fedu.dto.res;

import com.fedu.fedu.utils.enums.QuestionType;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Chi tiết một lượt làm bài cho màn CHẤM TAY của giáo viên.
 * Dùng cho attempt PENDING_REVIEW (đề có câu tự luận): giáo viên xem câu trả lời,
 * chấm đúng/sai từng câu tự luận; chấm đủ thì hệ thống chốt điểm + định tuyến.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttemptGradingDetailResponse {
    private Long attemptId;
    private Long testId;
    private String testTitle;
    private Long studentId;
    private String studentName;
    /** AttemptStatus name — PENDING_REVIEW = còn câu tự luận chưa chấm. */
    private String status;
    /** Điểm % cuối cùng; null khi chưa chấm xong. */
    private BigDecimal score;
    private LocalDateTime submittedAt;
    private List<ResponseGradingItem> responses;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResponseGradingItem {
        private Long responseId;
        private Long questionId;
        private String questionContent;
        private QuestionType questionType;
        /** Điểm tối đa của câu hỏi. */
        private BigDecimal maxScore;
        /** Trả lời văn bản (tự luận / điền từ); null với câu trắc nghiệm. */
        private String responseText;
        /** Nội dung các đáp án học sinh đã chọn (trắc nghiệm). */
        private List<String> selectedAnswers;
        /** true/false = đã chấm; null = câu tự luận chờ chấm. */
        private Boolean isCorrect;
    }
}

package com.fedu.fedu.utils.enums;

/**
 * Trạng thái một lượt làm bài (đặc biệt cho placement: hỗ trợ huỷ + làm lại).
 * IN_PROGRESS    – đã bắt đầu, chưa nộp.
 * PENDING_REVIEW – đã nộp nhưng có câu tự luận chờ giáo viên chấm; chưa có điểm,
 *                  chưa định tuyến (xếp mức / mở node) cho tới khi chấm xong.
 * SUBMITTED      – đã nộp & chấm xong (điểm cuối cùng).
 * CANCELLED      – bị huỷ (placement retake); không tính kết quả.
 */
public enum AttemptStatus {
    IN_PROGRESS,
    PENDING_REVIEW,
    SUBMITTED,
    CANCELLED
}

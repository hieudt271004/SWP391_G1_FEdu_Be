package com.fedu.fedu.utils.enums;

/**
 * Trạng thái một lượt làm bài (đặc biệt cho placement: hỗ trợ huỷ + làm lại).
 * IN_PROGRESS – đã bắt đầu, chưa nộp.
 * SUBMITTED   – đã nộp & chấm.
 * CANCELLED   – bị huỷ (placement retake); không tính kết quả.
 */
public enum AttemptStatus {
    IN_PROGRESS,
    SUBMITTED,
    CANCELLED
}

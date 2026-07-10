package com.fedu.fedu.utils.enums;

/**
 * Trạng thái làm bài pop-quiz của một học sinh được giao (test_assignment_students).
 * PENDING     – được giao, chưa bắt đầu.
 * IN_PROGRESS – đã bắt đầu, chưa nộp/chưa hết giờ.
 * SUBMITTED   – đã nộp đúng hạn, đã chấm.
 * EXPIRED     – hết giờ chưa nộp; chốt 0 điểm.
 */
public enum PopQuizStudentStatus {
    PENDING,
    IN_PROGRESS,
    SUBMITTED,
    EXPIRED
}

package com.fedu.fedu.utils.enums;

public enum RetakeRequestStatus {
    PENDING,
    APPROVED,
    REJECTED,
    // Lượt thi lại đã duyệt và học sinh đã nộp bài làm lại — approval đã được "tiêu thụ",
    // học sinh có thể gửi yêu cầu thi lại mới.
    COMPLETED
}

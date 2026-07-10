package com.fedu.fedu.utils.enums;

/**
 * NORMAL   – bài test thường (gắn node học hoặc placement quiz).
 * POP_QUIZ – bài kiểm tra ad-hoc giáo viên giao bất chợt trong buổi ON_CLASS;
 *            bị chặn ở mọi endpoint test generic, chỉ truy cập qua flow pop-quiz (TestAssignment).
 */
public enum TestKind {
    NORMAL,
    POP_QUIZ
}

package com.fedu.fedu.utils.enums;

/**
 * Lý do thay đổi mức năng lực của học sinh trong một lớp-môn.
 * PLACEMENT – gán mức lần đầu sau bài test phân loại đầu vào.
 * GATE      – đổi mức tại cổng test giữa chừng.
 * RETAKE    – huỷ placement và làm lại, gán lại mức/lộ trình (Model A).
 */
public enum LevelChangeReason {
    PLACEMENT,
    GATE,
    RETAKE
}

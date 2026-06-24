package com.fedu.fedu.utils.enums;

/**
 * Lý do thay đổi mức năng lực của học sinh trong một lớp-môn.
 * PLACEMENT   – gán mức lần đầu sau bài test phân loại đầu vào.
 * GATE        – đổi mức tại cổng test phân luồng giữa chừng.
 * RETAKE      – huỷ placement và làm lại, gán lại mức/lộ trình.
 * FREE_CHOICE – đổi mức khi học sinh đạt 1 trong các bài "test tự do chọn".
 */
public enum LevelChangeReason {
    PLACEMENT,
    GATE,
    RETAKE,
    FREE_CHOICE
}

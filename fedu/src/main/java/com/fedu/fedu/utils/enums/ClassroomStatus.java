package com.fedu.fedu.utils.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Trạng thái vòng đời của một lớp học.
 * <ul>
 *   <li>{@code INACTIVE} – lớp vừa tạo, giảng viên chưa bắt đầu.</li>
 *   <li>{@code ACTIVE}   – giảng viên đã bắt đầu, lớp đang hoạt động.</li>
 *   <li>{@code COMPLETED} – admin/giảng viên đã kết thúc lớp.</li>
 * </ul>
 * Giá trị lưu DB và trả về JSON đều ở dạng chữ thường ({@code inactive/active/completed})
 * để giữ nguyên dữ liệu cũ và hợp đồng API hiện có — xem {@code ClassroomStatusConverter}.
 */
public enum ClassroomStatus {
    INACTIVE("inactive"),
    ACTIVE("active"),
    COMPLETED("completed");

    private final String value;

    ClassroomStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    /** Parse linh hoạt: chấp nhận cả giá trị chữ thường ("active") lẫn tên enum ("ACTIVE"). */
    @JsonCreator
    public static ClassroomStatus fromValue(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        for (ClassroomStatus s : values()) {
            if (s.value.equalsIgnoreCase(raw) || s.name().equalsIgnoreCase(raw)) {
                return s;
            }
        }
        throw new IllegalArgumentException("Trạng thái lớp học không hợp lệ: " + raw);
    }
}

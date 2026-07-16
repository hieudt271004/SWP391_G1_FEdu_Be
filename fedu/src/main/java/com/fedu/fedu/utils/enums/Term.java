package com.fedu.fedu.utils.enums;

/**
 * Học kỳ trong năm học. Theo lịch FPT: 3 kỳ Spring / Summer / Fall.
 * Kết hợp với {@code academicYear} (năm) tạo thành "Kì học" đầy đủ, ví dụ "Fall 2024".
 */
public enum Term {
    SPRING("Spring"),
    SUMMER("Summer"),
    FALL("Fall");

    private final String label;

    Term(String label) {
        this.label = label;
    }

    /** Nhãn hiển thị tiếng Anh (khớp dữ liệu cũ dạng "Fall 2024"). */
    public String getLabel() {
        return label;
    }
}

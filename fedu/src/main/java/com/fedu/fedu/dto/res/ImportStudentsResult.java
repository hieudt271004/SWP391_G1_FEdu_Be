package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/** Báo cáo kết quả import sinh viên bằng Excel. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ImportStudentsResult {
    @Builder.Default
    private int totalRows = 0;
    /** Số tài khoản mới được tạo. */
    @Builder.Default
    private int created = 0;
    /** Số sinh viên được thêm vào lớp-môn lần này (gồm cả tài khoản đã có sẵn). */
    @Builder.Default
    private int enrolled = 0;
    /** Số dòng bỏ qua vì đã có trong lớp-môn. */
    @Builder.Default
    private int skipped = 0;
    /** Số dòng lỗi. */
    @Builder.Default
    private int failed = 0;
    @Builder.Default
    private List<ImportRowError> errors = new ArrayList<>();
}

package com.fedu.fedu.dto.res;

import lombok.*;

/**
 * Một đề trong lộ trình lớp-môn có thể tái dùng để giao pop quiz.
 * Chỉ liệt kê đề đã đủ điều kiện (có thời lượng, có câu hỏi, toàn câu tự chấm được),
 * nên bất kỳ đề nào trả về đây đều giao được ngay.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignablePopQuizTestResponse {
    private Long testId;
    private String title;
    private Integer durationMinutes;
    private int questionCount;
    /** Node chứa đề (giúp giáo viên phân biệt khi nhiều đề trùng tên). */
    private String sourceNodeTitle;
    private Integer stageOrder;
}

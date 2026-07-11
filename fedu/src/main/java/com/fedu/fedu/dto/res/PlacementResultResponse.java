package com.fedu.fedu.dto.res;

import lombok.*;

import java.math.BigDecimal;

/** Kết quả bài test phân loại: điểm và mức được gán. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementResultResponse {
    private Long testId;
    private BigDecimal score;
    private Integer assignedLevel; // 1=yếu, 2=tb, 3=khá
    /** true = bài có câu tự luận, chờ giáo viên chấm xong mới có điểm + xếp mức. */
    private Boolean pendingManualGrading;
}

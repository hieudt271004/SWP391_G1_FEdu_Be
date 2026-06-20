package com.fedu.fedu.service;

import com.fedu.fedu.utils.enums.LevelChangeReason;

import java.math.BigDecimal;

/**
 * Định tuyến theo mức năng lực: ánh xạ điểm quiz vào khoảng điểm (score band),
 * gán/đổi mức của học sinh, ghi lịch sử và mở lại node nhánh theo mức mới.
 */
public interface LevelRoutingService {

    /** Tìm mức mục tiêu theo khoảng điểm của một bài quiz; null nếu không có band khớp. */
    Integer resolveLevel(Long testId, BigDecimal percentage);

    /** Gán mức lần đầu sau bài test phân loại (oldLevel = null), ghi lịch sử PLACEMENT. */
    void assignInitialLevel(Long classroomSubjectId, Long studentId, Integer level, LevelChangeReason reason);

    /**
     * Cổng test: nếu bài test có score band, ánh xạ điểm → mức mới; nếu khác mức hiện tại
     * thì đổi mức, ghi lịch sử GATE và mở lại node nhánh các chặng chưa hoàn thành theo mức mới.
     */
    void applyGateBands(Long classroomSubjectId, Long testId, Long studentId, BigDecimal percentage);
}

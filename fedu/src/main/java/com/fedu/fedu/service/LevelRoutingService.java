package com.fedu.fedu.service;

import com.fedu.fedu.entity.LearningNode;
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

    void applyGateRouting(Long classroomSubjectId, LearningNode gateNode, Long studentId, BigDecimal percentage);

    void applyFreeChoiceRouting(Long classroomSubjectId, LearningNode freeChoiceNode, Long studentId);
}

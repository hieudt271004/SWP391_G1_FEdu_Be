package com.fedu.fedu.service;

import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.utils.enums.LevelChangeReason;

import java.math.BigDecimal;





public interface LevelRoutingService {

    
    Integer resolveLevel(Long testId, BigDecimal percentage);

    
    void assignInitialLevel(Long classroomSubjectId, Long studentId, Integer level, LevelChangeReason reason);

    void applyGateRouting(Long classroomSubjectId, LearningNode gateNode, Long studentId, BigDecimal percentage);

    void applyFreeChoiceRouting(Long classroomSubjectId, LearningNode freeChoiceNode, Long studentId);

    void applyPlacementRetakeRouting(Long classroomSubjectId, LearningNode placementNode, Long studentId,
                                     Long testId, BigDecimal percentage);
}

package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.LearningPathRepository;
import com.fedu.fedu.repository.NodeEdgeRepository;
import com.fedu.fedu.repository.QuizScoreBandRepository;
import com.fedu.fedu.repository.StudentLevelHistoryRepository;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.utils.enums.NodeTestKind;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/** Unit test cho lõi định tuyến GATE (applyGateRouting) — không cần DB/Spring context. */
@ExtendWith(MockitoExtension.class)
class LevelRoutingServiceImplTest {

    @Mock private QuizScoreBandRepository quizScoreBandRepository;
    @Mock private ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    @Mock private StudentLevelHistoryRepository studentLevelHistoryRepository;
    @Mock private StudentNodeProgressRepository studentNodeProgressRepository;
    @Mock private NodeEdgeRepository nodeEdgeRepository;
    @Mock private LearningPathRepository learningPathRepository;

    @InjectMocks private LevelRoutingServiceImpl service;

    private static final long CS_ID = 10L;
    private static final long STUDENT_ID = 1L;

    private static BigDecimal bd(int v) {
        return BigDecimal.valueOf(v);
    }

    private LearningNode gate(String applies, BigDecimal up, BigDecimal down) {
        return LearningNode.builder()
                .testKind(NodeTestKind.GATE)
                .appliesLevels(applies)
                .gateUpMin(up)
                .gateDownMax(down)
                .build();
    }

    private ClassroomSubjectStudent css(Integer level) {
        return ClassroomSubjectStudent.builder()
                .currentLevel(level)
                .student(new UserAccount())
                .classroomSubject(new ClassroomSubject())
                .build();
    }

    private void stubFind(ClassroomSubjectStudent css) {
        when(classroomSubjectStudentRepository
                .findByClassroomSubject_IdAndStudent_UserId(CS_ID, STUDENT_ID))
                .thenReturn(Optional.of(css));
    }

    @Test
    void up_movesUpOneLevelWithinApplies() {
        ClassroomSubjectStudent css = css(1); // Yếu
        stubFind(css);

        service.applyGateRouting(CS_ID, gate("1,2", bd(80), bd(40)), STUDENT_ID, bd(85));

        assertEquals(2, css.getCurrentLevel()); // lên TB
        verify(studentLevelHistoryRepository).save(any());
    }

    @Test
    void down_movesDownOneLevelWithinApplies() {
        ClassroomSubjectStudent css = css(2); // TB
        stubFind(css);

        service.applyGateRouting(CS_ID, gate("1,2", bd(80), bd(40)), STUDENT_ID, bd(30));

        assertEquals(1, css.getCurrentLevel()); // xuống Yếu
        verify(studentLevelHistoryRepository).save(any());
    }

    @Test
    void middleScore_keepsLevel() {
        ClassroomSubjectStudent css = css(2);
        stubFind(css);

        service.applyGateRouting(CS_ID, gate("1,2", bd(80), bd(40)), STUDENT_ID, bd(60));

        assertEquals(2, css.getCurrentLevel());
        verify(studentLevelHistoryRepository, never()).save(any());
    }

    @Test
    void up_clampedAtTopOfApplies() {
        ClassroomSubjectStudent css = css(2); // đã ở đỉnh của {1,2}
        stubFind(css);

        service.applyGateRouting(CS_ID, gate("1,2", bd(80), bd(40)), STUDENT_ID, bd(95));

        assertEquals(2, css.getCurrentLevel()); // không vượt max(applies)
        verify(studentLevelHistoryRepository, never()).save(any());
    }

    @Test
    void singleLevelGate_neverChangesLevel() {
        ClassroomSubjectStudent css = css(3); // Khá, gate chỉ {3}
        stubFind(css);

        service.applyGateRouting(CS_ID, gate("3", bd(80), bd(40)), STUDENT_ID, bd(95));

        assertEquals(3, css.getCurrentLevel());
        verify(studentLevelHistoryRepository, never()).save(any());
    }

    @Test
    void currentLevelOutsideApplies_isIgnored() {
        ClassroomSubjectStudent css = css(3); // Khá nhưng gate phụ trách {1,2}
        stubFind(css);

        service.applyGateRouting(CS_ID, gate("1,2", bd(80), bd(40)), STUDENT_ID, bd(95));

        assertEquals(3, css.getCurrentLevel());
        verify(studentLevelHistoryRepository, never()).save(any());
    }

    @Test
    void nullCurrentLevel_isIgnored() {
        ClassroomSubjectStudent css = css(null);
        stubFind(css);

        service.applyGateRouting(CS_ID, gate("1,2", bd(80), bd(40)), STUDENT_ID, bd(95));

        assertNull(css.getCurrentLevel());
        verify(studentLevelHistoryRepository, never()).save(any());
    }

    @Test
    void nonGateNode_isIgnored() {
        LearningNode placement = LearningNode.builder()
                .testKind(NodeTestKind.PLACEMENT)
                .appliesLevels("1,2,3")
                .build();

        service.applyGateRouting(CS_ID, placement, STUDENT_ID, bd(95));

        verifyNoInteractions(classroomSubjectStudentRepository);
        verifyNoInteractions(studentLevelHistoryRepository);
    }
}

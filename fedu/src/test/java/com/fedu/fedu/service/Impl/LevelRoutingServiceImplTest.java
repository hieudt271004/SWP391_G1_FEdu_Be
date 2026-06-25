package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.entity.UserAccount;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.LearningPathRepository;
import com.fedu.fedu.repository.NodeEdgeRepository;
import com.fedu.fedu.repository.QuizScoreBandRepository;
import com.fedu.fedu.repository.StudentLevelHistoryRepository;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.utils.enums.NodeTestKind;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
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

    private LearningNode learnNode(long nodeId, int level) {
        return LearningNode.builder().nodeId(nodeId).testKind(NodeTestKind.NONE).level(level).build();
    }

    private LearningNode testNode(long nodeId, NodeTestKind kind, int level) {
        return LearningNode.builder().nodeId(nodeId).testKind(kind).level(level).build();
    }

    private StudentNodeProgress prog(LearningNode node, StudentProgressStatus status) {
        return StudentNodeProgress.builder().learningNode(node).status(status).build();
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

    @Test
    void levelChange_reopensMatchingLearningBranch_locksOtherLevel_keepsTestNodes() {
        long pathId = 50L;
        ClassroomSubjectStudent css = css(1); // Yếu → gate {1,2} đạt 85 → lên TB (2)
        stubFind(css);
        when(learningPathRepository.findFirstByClassroomSubjectIdAndIsDeletedFalseOrderByPathIdAsc(CS_ID))
                .thenReturn(Optional.of(LearningPath.builder().pathId(pathId).build()));

        StudentNodeProgress pTb = prog(learnNode(201L, 2), StudentProgressStatus.LOCKED);   // mức mới
        StudentNodeProgress pYeu = prog(learnNode(202L, 1), StudentProgressStatus.OPEN);    // mức cũ
        StudentNodeProgress pFcKha = prog(testNode(203L, NodeTestKind.FREE_CHOICE, 3),
                StudentProgressStatus.OPEN);                                                // node test mức 3
        when(studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(STUDENT_ID, pathId))
                .thenReturn(new ArrayList<>(List.of(pTb, pYeu, pFcKha)));
        when(nodeEdgeRepository.findByToNodeNodeId(201L)).thenReturn(List.of()); // TB không tiên quyết → mở

        service.applyGateRouting(CS_ID, gate("1,2", bd(80), bd(40)), STUDENT_ID, bd(85));

        assertEquals(2, css.getCurrentLevel());
        assertEquals(StudentProgressStatus.OPEN, pTb.getStatus());    // nhánh học TB mở
        assertEquals(StudentProgressStatus.LOCKED, pYeu.getStatus()); // nhánh học Yếu khóa lại
        assertEquals(StudentProgressStatus.OPEN, pFcKha.getStatus()); // node test KHÔNG bị khóa theo mức
    }

    // ── P2c: applyFreeChoiceRouting ───────────────────────────────────────────

    @Test
    void freeChoice_passSetsLevelToNodeTargetLevel() {
        ClassroomSubjectStudent css = css(1); // Yếu
        stubFind(css);

        service.applyFreeChoiceRouting(CS_ID, testNode(300L, NodeTestKind.FREE_CHOICE, 3), STUDENT_ID);

        assertEquals(3, css.getCurrentLevel()); // chọn & đạt bài Khá → lên Khá
        verify(studentLevelHistoryRepository).save(any());
    }

    @Test
    void freeChoice_alreadyAtTargetLevel_noChange() {
        ClassroomSubjectStudent css = css(3);
        stubFind(css);

        service.applyFreeChoiceRouting(CS_ID, testNode(300L, NodeTestKind.FREE_CHOICE, 3), STUDENT_ID);

        assertEquals(3, css.getCurrentLevel());
        verify(studentLevelHistoryRepository, never()).save(any());
    }

    @Test
    void freeChoice_nonFreeChoiceNode_isIgnored() {
        service.applyFreeChoiceRouting(CS_ID, gate("1,2", bd(80), bd(40)), STUDENT_ID);

        verifyNoInteractions(classroomSubjectStudentRepository);
        verifyNoInteractions(studentLevelHistoryRepository);
    }
}

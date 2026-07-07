package com.fedu.fedu.service.Impl;

import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.entity.ClassroomSubjectStudent;
import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.LearningPath;
import com.fedu.fedu.entity.NodeEdge;
import com.fedu.fedu.entity.StudentNodeProgress;
import com.fedu.fedu.repository.ClassroomSubjectStudentRepository;
import com.fedu.fedu.repository.NodeEdgeRepository;
import com.fedu.fedu.repository.StudentNodeProgressRepository;
import com.fedu.fedu.repository.StudentTestAttemptRepository;
import com.fedu.fedu.repository.StudentTestResponseRepository;
import com.fedu.fedu.repository.TestAnswerRepository;
import com.fedu.fedu.repository.TestQuestionRepository;
import com.fedu.fedu.repository.TestRepository;
import com.fedu.fedu.repository.UserAccountRepository;
import com.fedu.fedu.service.LevelRoutingService;
import com.fedu.fedu.utils.enums.NodeTestKind;
import com.fedu.fedu.utils.enums.NodeType;
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
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Unit test cho phần KEO NỐI của Phần 2 — routeGateNode (định tuyến node GATE).
 * Lõi đổi mức (applyGateRouting) được mock vì đã test riêng ở LevelRoutingServiceImplTest.
 */
@ExtendWith(MockitoExtension.class)
class StudentTestServiceImplGateRoutingTest {

    @Mock private TestRepository testRepository;
    @Mock private TestQuestionRepository testQuestionRepository;
    @Mock private TestAnswerRepository testAnswerRepository;
    @Mock private StudentTestAttemptRepository studentTestAttemptRepository;
    @Mock private StudentTestResponseRepository studentTestResponseRepository;
    @Mock private StudentNodeProgressRepository studentNodeProgressRepository;
    @Mock private ClassroomSubjectStudentRepository classroomSubjectStudentRepository;
    @Mock private NodeEdgeRepository nodeEdgeRepository;
    @Mock private UserAccountRepository userAccountRepository;
    @Mock private LevelRoutingService levelRoutingService;
    @Mock private com.fedu.fedu.repository.LearningNodeRepository learningNodeRepository;

    @InjectMocks private StudentTestServiceImpl service;

    private static final long STUDENT_ID = 1L;
    private static final long PATH_ID = 50L;
    private static final long CS_ID = 10L;
    private static final long GATE_ID = 100L;
    private static final long TARGET_ID = 200L;

    private static BigDecimal bd(int v) {
        return BigDecimal.valueOf(v);
    }

    private LearningPath path(ClassroomSubject cs) {
        return LearningPath.builder().pathId(PATH_ID).classroomSubject(cs).build();
    }

    private LearningNode gate(LearningPath path) {
        return LearningNode.builder()
                .nodeId(GATE_ID)
                .testKind(NodeTestKind.GATE)
                .nodeType(NodeType.AT_HOME)
                .appliesLevels("1,2")
                .learningPath(path)
                .build();
    }

    private LearningNode branch(LearningPath path, int level) {
        return LearningNode.builder()
                .nodeId(TARGET_ID)
                .testKind(NodeTestKind.NONE)
                .nodeType(NodeType.AT_HOME)
                .level(level)
                .learningPath(path)
                .build();
    }

    private StudentNodeProgress progress(LearningNode node, LearningPath path, StudentProgressStatus status) {
        return StudentNodeProgress.builder().learningNode(node).learningPath(path).status(status).build();
    }

    @Test
    void gate_completesNode_callsRouting_andOpensMatchingBranch() {
        ClassroomSubject cs = ClassroomSubject.builder().id(CS_ID).build();
        LearningPath path = path(cs);
        LearningNode gate = gate(path);
        LearningNode target = branch(path, 2); // nhánh TB
        NodeEdge edge = NodeEdge.builder().fromNode(gate).toNode(target).build(); // cạnh chính (maxScore null)

        StudentNodeProgress gateProg = progress(gate, path, StudentProgressStatus.IN_PROGRESS);
        StudentNodeProgress targetProg = progress(target, path, StudentProgressStatus.LOCKED);
        List<StudentNodeProgress> all = new ArrayList<>(List.of(gateProg, targetProg));

        when(studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(STUDENT_ID, PATH_ID))
                .thenReturn(all);
        when(nodeEdgeRepository.findByFromNodeNodeId(GATE_ID)).thenReturn(List.of(edge));
        when(nodeEdgeRepository.findByToNodeNodeId(TARGET_ID)).thenReturn(List.of(edge));
        when(classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(CS_ID, STUDENT_ID))
                .thenReturn(Optional.of(ClassroomSubjectStudent.builder().currentLevel(2).build()));

        service.routeGateNode(STUDENT_ID, gate, PATH_ID, bd(85));

        // 1) node cổng hoàn thành
        assertEquals(StudentProgressStatus.COMPLETED, gateProg.getStatus());
        // 2) gọi lõi đổi mức đúng tham số
        verify(levelRoutingService).applyGateRouting(eq(CS_ID), eq(gate), eq(STUDENT_ID), eq(bd(85)));
        // 3) nhánh đích khớp mức được mở
        assertEquals(StudentProgressStatus.OPEN, targetProg.getStatus());
    }

    @Test
    void gate_completesAndRoutes_butDoesNotOpenBranchOfDifferentLevel() {
        ClassroomSubject cs = ClassroomSubject.builder().id(CS_ID).build();
        LearningPath path = path(cs);
        LearningNode gate = gate(path);
        LearningNode target = branch(path, 3); // nhánh Khá, KHÔNG khớp mức HS (1)
        NodeEdge edge = NodeEdge.builder().fromNode(gate).toNode(target).build();

        StudentNodeProgress gateProg = progress(gate, path, StudentProgressStatus.IN_PROGRESS);
        StudentNodeProgress targetProg = progress(target, path, StudentProgressStatus.LOCKED);
        List<StudentNodeProgress> all = new ArrayList<>(List.of(gateProg, targetProg));

        when(studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(STUDENT_ID, PATH_ID))
                .thenReturn(all);
        when(nodeEdgeRepository.findByFromNodeNodeId(GATE_ID)).thenReturn(List.of(edge));
        when(classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(CS_ID, STUDENT_ID))
                .thenReturn(Optional.of(ClassroomSubjectStudent.builder().currentLevel(1).build()));

        service.routeGateNode(STUDENT_ID, gate, PATH_ID, bd(85));

        assertEquals(StudentProgressStatus.COMPLETED, gateProg.getStatus());
        verify(levelRoutingService).applyGateRouting(eq(CS_ID), eq(gate), eq(STUDENT_ID), eq(bd(85)));
        assertEquals(StudentProgressStatus.LOCKED, targetProg.getStatus()); // không mở vì khác mức
    }

    // ── P2c: routeFreeChoiceNode ──────────────────────────────────────────────

    private LearningNode freeChoice(LearningPath path, long nodeId, int level) {
        return LearningNode.builder()
                .nodeId(nodeId)
                .testKind(NodeTestKind.FREE_CHOICE)
                .nodeType(NodeType.AT_HOME)
                .level(level)
                .stageOrder(2)
                .learningPath(path)
                .build();
    }

    @Test
    void freeChoice_passed_completesNode_locksSibling_callsRouting_opensBranch() {
        ClassroomSubject cs = ClassroomSubject.builder().id(CS_ID).build();
        LearningPath path = path(cs);
        LearningNode fcKha = freeChoice(path, 300L, 3); // node tự do mức Khá đang chọn
        LearningNode fcYeu = freeChoice(path, 301L, 1); // node tự do mức Yếu cùng nhóm
        LearningNode branchKha = branch(path, 3);       // nhánh Khá (nodeId TARGET_ID)
        NodeEdge edge = NodeEdge.builder().fromNode(fcKha).toNode(branchKha).build();

        StudentNodeProgress pKha = progress(fcKha, path, StudentProgressStatus.IN_PROGRESS);
        StudentNodeProgress pYeu = progress(fcYeu, path, StudentProgressStatus.OPEN);
        StudentNodeProgress pBranch = progress(branchKha, path, StudentProgressStatus.LOCKED);
        List<StudentNodeProgress> all = new ArrayList<>(List.of(pKha, pYeu, pBranch));

        when(studentNodeProgressRepository.findByStudentUserIdAndLearningPathPathId(STUDENT_ID, PATH_ID))
                .thenReturn(all);
        when(nodeEdgeRepository.findByFromNodeNodeId(300L)).thenReturn(List.of(edge));
        when(nodeEdgeRepository.findByToNodeNodeId(TARGET_ID)).thenReturn(List.of(edge));
        when(classroomSubjectStudentRepository.findByClassroomSubject_IdAndStudent_UserId(CS_ID, STUDENT_ID))
                .thenReturn(Optional.of(ClassroomSubjectStudent.builder().currentLevel(3).build()));

        service.routeFreeChoiceNode(STUDENT_ID, fcKha, PATH_ID, true);

        assertEquals(StudentProgressStatus.COMPLETED, pKha.getStatus());  // node đã chọn hoàn thành
        assertEquals(StudentProgressStatus.LOCKED, pYeu.getStatus());     // node tự do còn lại bị khóa
        verify(levelRoutingService).applyFreeChoiceRouting(eq(CS_ID), eq(fcKha), eq(STUDENT_ID));
        assertEquals(StudentProgressStatus.OPEN, pBranch.getStatus());    // nhánh Khá mở
    }

    @Test
    void freeChoice_notPassed_doesNothing() {
        LearningPath path = path(ClassroomSubject.builder().id(CS_ID).build());
        LearningNode fcKha = freeChoice(path, 300L, 3);

        service.routeFreeChoiceNode(STUDENT_ID, fcKha, PATH_ID, false);

        verifyNoInteractions(studentNodeProgressRepository);
        verifyNoInteractions(levelRoutingService);
    }
}

package com.fedu.fedu.utils;

import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.utils.enums.NodeTestKind;
import com.fedu.fedu.utils.enums.NodeType;
import com.fedu.fedu.utils.enums.StudentProgressStatus;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;

class NodeRoutingUtilsTest {

    private LearningNode node(long id, Integer stage, Integer level, NodeTestKind kind) {
        return LearningNode.builder()
                .nodeId(id)
                .stageOrder(stage)
                .level(level)
                .testKind(kind)
                .nodeType(NodeType.AT_HOME)
                .build();
    }

    @Test
    void progressCounts_freshStudent_countsCommonAndCurrentLevelOnly() {
        List<LearningNode> nodes = List.of(
                node(1, 1, null, NodeTestKind.PLACEMENT),
                node(2, 2, null, NodeTestKind.NONE),
                node(3, 3, 1, NodeTestKind.NONE),
                node(4, 3, 2, NodeTestKind.NONE),
                node(5, 3, 3, NodeTestKind.NONE),
                node(6, 4, null, NodeTestKind.GATE));
        Map<Long, StudentProgressStatus> status = Map.of(1L, StudentProgressStatus.COMPLETED);

        // Mức 2, chưa học gì: node chung (2, 6) + node mức 2 (4); placement không tính dù COMPLETED.
        assertArrayEquals(new int[]{0, 3},
                NodeRoutingUtils.progressCounts(nodes, status, 2));
    }

    @Test
    void progressCounts_bouncedStudent_keepsCreditForBranchesActuallyWalked() {
        // Mô phỏng học sinh bị chuyển mức: làm xong nhánh TB ở chặng 3, FREE_CHOICE Khá ở chặng 5,
        // hiện đứng ở mức Yếu với chặng 6 đang mở. (Thu gọn từ dữ liệu thật path 162 / css 238.)
        List<LearningNode> nodes = List.of(
                node(1, 1, null, NodeTestKind.PLACEMENT),
                node(2, 2, null, NodeTestKind.NONE),          // ON_CLASS chung, chưa học
                node(3, 3, 1, NodeTestKind.NONE),
                node(4, 3, 2, NodeTestKind.NONE),             // đã xong ở nhánh TB
                node(5, 3, 3, NodeTestKind.NONE),
                node(6, 4, null, NodeTestKind.GATE),          // gate chung đã xong
                node(7, 5, 1, NodeTestKind.FREE_CHOICE),
                node(8, 5, 3, NodeTestKind.FREE_CHOICE),      // đã chọn nhánh Khá
                node(9, 6, 1, NodeTestKind.NONE));            // nhánh Yếu hiện tại, đang mở
        Map<Long, StudentProgressStatus> status = Map.of(
                1L, StudentProgressStatus.COMPLETED,
                4L, StudentProgressStatus.COMPLETED,
                6L, StudentProgressStatus.COMPLETED,
                8L, StudentProgressStatus.COMPLETED,
                9L, StudentProgressStatus.OPEN);

        // Tính: 2 (chung) + 4 (nhánh TB đã đi) + 6 (gate) + 8 (FC đã chọn) + 9 (nhánh hiện tại)
        // = 5 node, đã xong 3. Node 3/5/7 thuộc nhánh không đi nên không tính; placement bỏ qua.
        assertArrayEquals(new int[]{3, 5},
                NodeRoutingUtils.progressCounts(nodes, status, 1));
    }

    @Test
    void progressCounts_currentBranchWins_whenStageWalkedAtTwoLevels() {
        // Sau khi bị hạ mức, chặng 3 có node TB đã xong VÀ node Yếu vừa mở lại:
        // chặng theo nhánh hiện tại (Yếu), còn bài TB cũ vẫn được giữ công.
        List<LearningNode> nodes = List.of(
                node(1, 3, 1, NodeTestKind.NONE),
                node(2, 3, 2, NodeTestKind.NONE),
                node(3, 3, 3, NodeTestKind.NONE));
        Map<Long, StudentProgressStatus> status = Map.of(
                1L, StudentProgressStatus.OPEN,
                2L, StudentProgressStatus.COMPLETED);

        assertArrayEquals(new int[]{1, 2},
                NodeRoutingUtils.progressCounts(nodes, status, 1));
    }
}

package com.fedu.fedu.utils;

import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.NodeEdge;
import com.fedu.fedu.utils.enums.NodeTestKind;
import com.fedu.fedu.utils.enums.StudentProgressStatus;

import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;


public final class NodeRoutingUtils {

    private NodeRoutingUtils() {
    }


    public static LearningNode entryPlacementNode(Collection<LearningNode> pathNodes) {
        return pathNodes.stream()
                .filter(n -> n.getTestKind() == NodeTestKind.PLACEMENT)
                .min(Comparator
                        .comparing((LearningNode n) -> n.getStageOrder() != null ? n.getStageOrder() : Integer.MAX_VALUE)
                        .thenComparing(n -> n.getDisplayOrder() != null ? n.getDisplayOrder() : Integer.MAX_VALUE)
                        .thenComparing(LearningNode::getNodeId))
                .orElse(null);
    }


    public static boolean isEntryPlacement(LearningNode node, Collection<LearningNode> pathNodes) {
        LearningNode entry = entryPlacementNode(pathNodes);
        return entry != null && node != null && entry.getNodeId().equals(node.getNodeId());
    }

    public static boolean incomingPrereqMet(List<NodeEdge> incoming,
                                            Map<Long, StudentProgressStatus> statusByNode,
                                            Integer studentLevel) {
        return incoming.stream()
                .filter(e -> {
                    Integer fromLevel = e.getFromNode().getLevel();
                    boolean otherLevelBranch =
                            fromLevel != null && studentLevel != null && !fromLevel.equals(studentLevel);
                    return !otherLevelBranch;
                })
                .allMatch(e -> statusByNode.get(e.getFromNode().getNodeId())
                        == StudentProgressStatus.COMPLETED);
    }
}

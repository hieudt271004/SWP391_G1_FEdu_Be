package com.fedu.fedu.utils;

import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.NodeEdge;
import com.fedu.fedu.utils.enums.NodeTestKind;
import com.fedu.fedu.utils.enums.NodeType;
import com.fedu.fedu.utils.enums.StudentProgressStatus;

import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;


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


    public static boolean prereqMetThroughOnClass(Long nodeId,
                                                  Function<Long, List<NodeEdge>> incomingByNode,
                                                  Map<Long, StudentProgressStatus> statusByNode,
                                                  Integer studentLevel) {
        return prereqRec(nodeId, incomingByNode, statusByNode, studentLevel, new HashSet<>());
    }

    private static boolean prereqRec(Long nodeId,
                                     Function<Long, List<NodeEdge>> incomingByNode,
                                     Map<Long, StudentProgressStatus> statusByNode,
                                     Integer studentLevel,
                                     Set<Long> visited) {
        if (!visited.add(nodeId)) {
            return true;
        }
        for (NodeEdge e : incomingByNode.apply(nodeId)) {
            LearningNode from = e.getFromNode();
            Integer fromLevel = from.getLevel();
            boolean otherLevelBranch =
                    fromLevel != null && studentLevel != null && !fromLevel.equals(studentLevel);
            if (otherLevelBranch) {
                continue;
            }
            if (from.getNodeType() == NodeType.ON_CLASS) {

                if (!prereqRec(from.getNodeId(), incomingByNode, statusByNode, studentLevel, visited)) {
                    return false;
                }
            } else if (statusByNode.get(from.getNodeId()) != StudentProgressStatus.COMPLETED) {
                return false;
            }
        }
        return true;
    }
}

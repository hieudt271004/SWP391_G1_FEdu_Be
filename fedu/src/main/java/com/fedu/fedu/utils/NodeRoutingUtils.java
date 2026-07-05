package com.fedu.fedu.utils;

import com.fedu.fedu.entity.NodeEdge;
import com.fedu.fedu.utils.enums.StudentProgressStatus;

import java.util.List;
import java.util.Map;


public final class NodeRoutingUtils {

    private NodeRoutingUtils() {
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

package com.fedu.fedu.utils;

import com.fedu.fedu.entity.LearningNode;
import com.fedu.fedu.entity.NodeEdge;
import com.fedu.fedu.utils.enums.NodeTestKind;
import com.fedu.fedu.utils.enums.NodeType;
import com.fedu.fedu.utils.enums.StudentProgressStatus;

import com.fedu.fedu.entity.StudentNodeProgress;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
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


    public static Set<Integer> stagesClearedAtOtherLevel(Collection<StudentNodeProgress> progressList,
                                                         Integer studentLevel) {
        Set<Integer> stages = new HashSet<>();
        if (progressList == null) {
            return stages;
        }
        for (StudentNodeProgress p : progressList) {
            if (p.getStatus() != StudentProgressStatus.COMPLETED) {
                continue;
            }
            LearningNode n = p.getLearningNode();
            if ((n.getTestKind() == null || n.getTestKind() == NodeTestKind.NONE)
                    && n.getLevel() != null
                    && !n.getLevel().equals(studentLevel)
                    && n.getStageOrder() != null) {
                stages.add(n.getStageOrder());
            }
        }
        return stages;
    }


    public static boolean alreadyClearedAtOtherLevel(LearningNode node, Set<Integer> stagesClearedAtOtherLevel) {
        return node.getLevel() != null
                && node.getStageOrder() != null
                && stagesClearedAtOtherLevel.contains(node.getStageOrder());
    }

    public static Set<Integer> parseAppliesLevels(String csv) {
        Set<Integer> out = new LinkedHashSet<>();
        if (csv == null || csv.isBlank()) {
            return out;
        }
        for (String part : csv.split(",")) {
            try {
                int v = Integer.parseInt(part.trim());
                if (v >= LearningLevels.MIN && v <= LearningLevels.MAX) {
                    out.add(v);
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return out;
    }


    /**
     * Đếm tiến độ {completed, total} theo nhánh học sinh ĐÃ ĐI ở từng chặng, không chỉ mức hiện tại.
     * Học sinh có thể bị chuyển mức nhiều lần (gate/free-choice/thi lại placement); bài đã hoàn
     * thành ở nhánh mức cũ là công sức thật — nếu chỉ lọc theo mức hiện tại thì tiến độ sụt ảo
     * ngay sau mỗi lần chuyển mức. Mỗi chặng lấy nhánh mà học sinh thực sự đi (node theo mức có
     * progress OPEN/IN_PROGRESS/COMPLETED, ưu tiên mức hiện tại), chặng chưa chạm tới tính theo
     * mức hiện tại. Node đã COMPLETED luôn được tính dù thuộc nhánh nào. Bài phân loại không
     * phải nội dung học nên bỏ qua. Dùng chung cho student graph lẫn báo cáo giáo viên để hai
     * phía luôn ra cùng một con số.
     */
    public static int[] progressCounts(Collection<LearningNode> pathNodes,
                                       Map<Long, StudentProgressStatus> statusByNode,
                                       Integer studentLevel) {
        Map<Integer, Integer> activeLevelByStage = new java.util.HashMap<>();
        for (LearningNode n : pathNodes) {
            if (n.getLevel() == null) {
                continue;
            }
            StudentProgressStatus s = statusByNode.get(n.getNodeId());
            boolean walked = s == StudentProgressStatus.COMPLETED
                    || s == StudentProgressStatus.IN_PROGRESS
                    || s == StudentProgressStatus.OPEN;
            if (!walked) {
                continue;
            }
            int stage = n.getStageOrder() != null ? n.getStageOrder() : 0;
            // Mức hiện tại thắng: sau khi chuyển mức, nhánh cũ COMPLETED và nhánh mới được mở lại
            // có thể cùng chặng — chặng đó phải theo nhánh mới (bài cũ vẫn tính nhờ vế isCompleted).
            if (!activeLevelByStage.containsKey(stage) || n.getLevel().equals(studentLevel)) {
                activeLevelByStage.put(stage, n.getLevel());
            }
        }

        int total = 0;
        int completed = 0;
        for (LearningNode n : pathNodes) {
            if (n.getTestKind() == NodeTestKind.PLACEMENT) {
                continue;
            }
            int stage = n.getStageOrder() != null ? n.getStageOrder() : 0;
            Integer active = activeLevelByStage.get(stage);
            boolean isCompleted = statusByNode.get(n.getNodeId()) == StudentProgressStatus.COMPLETED;
            boolean countable = n.getLevel() == null
                    || n.getLevel().equals(active)
                    || isCompleted
                    || (active == null && n.getLevel().equals(studentLevel));
            if (countable) {
                total++;
                if (isCompleted) {
                    completed++;
                }
            }
        }
        return new int[]{completed, total};
    }

    public static boolean isSingleLevelGate(LearningNode node) {
        if (node.getTestKind() != NodeTestKind.GATE) {
            return false;
        }
        Set<Integer> applies = parseAppliesLevels(node.getAppliesLevels());
        if (!applies.isEmpty()) {
            return applies.size() == 1;
        }
        return node.getLevel() != null;
    }

    public static boolean appliesToLevel(LearningNode node, Integer studentLevel) {
        String csv = node.getAppliesLevels();
        if (csv == null || csv.isBlank()) {
            return true;
        }
        for (String part : csv.split(",")) {
            try {
                if (studentLevel != null && Integer.parseInt(part.trim()) == studentLevel) {
                    return true;
                }
            } catch (NumberFormatException ignored) {
            }
        }
        return false;
    }


    public static boolean unlockableAtLevel(LearningNode node, Integer studentLevel) {
        if (node.getTestKind() == NodeTestKind.FREE_CHOICE) {
            return true;
        }
        if (node.getLevel() == null) {
            return appliesToLevel(node, studentLevel);
        }
        return node.getLevel().equals(studentLevel);
    }


    public static int maxCompletedAtHomeStage(Collection<StudentNodeProgress> progressList) {
        int max = 0;
        if (progressList == null) {
            return max;
        }
        for (StudentNodeProgress p : progressList) {
            if (p.getStatus() != StudentProgressStatus.COMPLETED) {
                continue;
            }
            LearningNode n = p.getLearningNode();
            // Chỉ tính node học riêng theo mức: ON_CLASS tự COMPLETED khi buổi học qua giờ,
            // còn node chung được GIỮ qua thi lại — cả hai đều không phản ánh vị trí thật của HS.
            if (n.getNodeType() != NodeType.ON_CLASS && n.getLevel() != null
                    && n.getStageOrder() != null && n.getStageOrder() > max) {
                max = n.getStageOrder();
            }
        }
        return max;
    }

    public static Set<Integer> stagesWithChosenFreeChoice(Collection<StudentNodeProgress> progressList) {
        Set<Integer> stages = new HashSet<>();
        if (progressList == null) {
            return stages;
        }
        for (StudentNodeProgress p : progressList) {
            if (p.getStatus() == StudentProgressStatus.COMPLETED) {
                LearningNode n = p.getLearningNode();
                if (n.getTestKind() == NodeTestKind.FREE_CHOICE && n.getStageOrder() != null) {
                    stages.add(n.getStageOrder());
                }
            }
        }
        return stages;
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
                                                  Integer studentLevel,
                                                  Collection<StudentNodeProgress> progressList) {
        return prereqRec(nodeId, incomingByNode, statusByNode, studentLevel, progressList, new HashSet<>());
    }

    private static boolean prereqRec(Long nodeId,
                                     Function<Long, List<NodeEdge>> incomingByNode,
                                     Map<Long, StudentProgressStatus> statusByNode,
                                     Integer studentLevel,
                                     Collection<StudentNodeProgress> progressList,
                                     Set<Long> visited) {
        if (!visited.add(nodeId)) {
            return true;
        }
        List<NodeEdge> incoming = incomingByNode.apply(nodeId);
        if (incoming.isEmpty()) {
            return true;
        }
        boolean anyRelevant = false;
        for (NodeEdge e : incoming) {
            LearningNode from = e.getFromNode();
            Integer fromLevel = from.getLevel();
            boolean otherLevelBranch =
                    fromLevel != null && studentLevel != null && !fromLevel.equals(studentLevel);
            if (otherLevelBranch) {
                continue;
            }
            anyRelevant = true;
            if (from.getNodeType() == NodeType.ON_CLASS) {
                if (!prereqRec(from.getNodeId(), incomingByNode, statusByNode, studentLevel, progressList, visited)) {
                    return false;
                }
            } else {
                boolean isCompleted = statusByNode.get(from.getNodeId()) == StudentProgressStatus.COMPLETED;
                // "Đã hoàn thành chặng này ở mức khác" chỉ áp dụng cho node HỌC (testKind NONE):
                // node test/gate là chốt bắt buộc, không được coi là đã qua chỉ vì có node HỌC
                // cùng chặng ở MỨC KHÁC đã xong. Nếu không, node dưới gate mở ra dù chưa làm gate.
                boolean fromIsContent = from.getTestKind() == null || from.getTestKind() == NodeTestKind.NONE;
                if (!isCompleted && fromIsContent && from.getLevel() != null
                        && from.getStageOrder() != null && progressList != null) {
                    for (StudentNodeProgress p : progressList) {
                        LearningNode n = p.getLearningNode();
                        boolean nIsContent = n.getTestKind() == null || n.getTestKind() == NodeTestKind.NONE;
                        if (nIsContent && n.getStageOrder() != null
                                && n.getStageOrder().equals(from.getStageOrder())
                                && n.getLevel() != null
                                && !n.getLevel().equals(from.getLevel())
                                && p.getStatus() == StudentProgressStatus.COMPLETED) {
                            isCompleted = true;
                            break;
                        }
                    }
                }
                if (!isCompleted) {
                    return false;
                }
            }
        }
        // Có cạnh vào nhưng tất cả đều thuộc nhánh mức khác: node này không tới được ở mức hiện tại.
        return anyRelevant;
    }
}

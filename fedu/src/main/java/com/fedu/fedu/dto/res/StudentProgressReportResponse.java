package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Một dòng báo cáo theo dõi của 1 học sinh trong lớp-môn (teacher xem):
 * tiến độ node + danh sách node hoàn thành trễ hạn.
 */
@Data
@Builder
public class StudentProgressReportResponse {
    private Long studentId;                 // UserAccount.userId — FE join theo id này
    private Long classroomSubjectStudentId;
    private String fullName;                // "lastName firstName" (thứ tự tên VN)
    private String email;
    private String avatarUrl;
    private Integer currentLevel;           // null = chưa phân mức

    // Tiến độ (chỉ tính node hiển thị với mức của học sinh, loại node PLACEMENT)
    private int completedNodes;
    private int totalNodes;

    // Hoàn thành trễ hạn
    private int lateCount;                  // = lateNodes.size()
    private List<LateNodeItem> lateNodes;

    @Data
    @Builder
    public static class LateNodeItem {
        private Long nodeId;
        private String title;
        private LocalDateTime deadlineAt;
        private LocalDateTime completedAt;
    }
}

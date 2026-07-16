package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;





@Data
@Builder
public class StudentProgressReportResponse {
    private Long studentId;                 
    private Long classroomSubjectStudentId;
    private String fullName;                
    private String email;
    private String avatarUrl;
    private Integer currentLevel;           

    
    private int completedNodes;
    private int totalNodes;

    
    private int lateCount;                  
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

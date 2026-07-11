package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;






@Data
@Builder
public class LiveSessionStateResponse {
    private Long nodeId;
    private String nodeTitle;

    
    private LocalDate studyDate;
    private String slotName;
    private LocalDateTime sessionWindowStart;
    private LocalDateTime sessionWindowEnd;

    
    private LocalDateTime sessionStartedAt;
    private LocalDateTime sessionEndedAt;
    
    private boolean live;
    
    private boolean canStart;
    
    private LocalDateTime serverTime;

    
    private NodeContentResponse content;

    
    private ActiveTestInfo activeTest;

    @Data
    @Builder
    public static class ActiveTestInfo {
        private Long testId;
        private String title;
        private Integer durationMinutes;
        private LocalDateTime releasedAt;
        private LocalDateTime releaseEndsAt;
    }
}

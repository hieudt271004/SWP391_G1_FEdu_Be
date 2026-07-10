package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Trạng thái buổi học live của 1 node ON_CLASS — FE (cả teacher lẫn student) polling
 * endpoint live-state mỗi ~5s để đồng bộ: tài liệu mới, đề vừa phát, giờ kết thúc chung.
 * Đồng hồ đếm ngược tính theo releaseEndsAt/serverTime (timestamp), không cần push.
 */
@Data
@Builder
public class LiveSessionStateResponse {
    private Long nodeId;
    private String nodeTitle;

    // Lịch buổi học (suy từ studyDate + slot)
    private LocalDate studyDate;
    private String slotName;
    private LocalDateTime sessionWindowStart;
    private LocalDateTime sessionWindowEnd;

    // Trạng thái phiên
    private LocalDateTime sessionStartedAt;
    private LocalDateTime sessionEndedAt;
    /** Buổi đang diễn ra (đã bắt đầu, chưa kết thúc, chưa quá giờ slot). */
    private boolean live;
    /** Teacher: đang trong khung giờ slot và chưa live → bấm "Bắt đầu buổi học" được. */
    private boolean canStart;
    /** Giờ server — FE dùng để tính lệch đồng hồ khi hiển thị đếm ngược. */
    private LocalDateTime serverTime;

    /** Nội dung node (student: đã lọc đề chưa phát). */
    private NodeContentResponse content;

    /** Đề đang trong giờ làm bài chung (phát gần nhất, chưa hết giờ); null = không có. */
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

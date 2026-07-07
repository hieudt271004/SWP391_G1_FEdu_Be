package com.fedu.fedu.dto.req;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class ScheduleNodeRequest {
    private LocalDate studyDate;
    private Long slotId;
    private boolean force;
    /**
     * Hạn hoàn thành node (tùy chọn). Nếu bỏ trống mà có studyDate + slot,
     * deadline được suy ra = hết giờ buổi học (studyDate + slot.endTime).
     */
    private java.time.LocalDateTime deadlineAt;
}

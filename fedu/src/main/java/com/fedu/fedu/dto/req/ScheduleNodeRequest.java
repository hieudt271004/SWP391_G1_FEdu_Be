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
    // Lưu ý: node ON_CLASS không mang deadline (deadline chỉ dành cho node Tự học,
    // đặt qua update node) — request xếp lịch không nhận deadline nữa.
}

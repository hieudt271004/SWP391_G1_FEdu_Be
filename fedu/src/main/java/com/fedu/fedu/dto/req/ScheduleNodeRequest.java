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
    
    
}

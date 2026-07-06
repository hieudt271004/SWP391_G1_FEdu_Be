package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalTime;

@Getter
@Setter
@Builder
public class SlotResponse {
    private Long slotId;
    private String slotName;
    private LocalTime startTime;
    private LocalTime endTime;
}

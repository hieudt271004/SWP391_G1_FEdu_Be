package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter
@Setter
@Builder
public class ScheduleConflictResponse {
    private boolean hasConflict;
    private String teacherConflictMessage;
    private List<StudentConflictDto> studentConflicts;
}

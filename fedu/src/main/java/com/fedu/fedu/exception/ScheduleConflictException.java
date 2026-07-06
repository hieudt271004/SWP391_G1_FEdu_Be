package com.fedu.fedu.exception;

import com.fedu.fedu.dto.res.ScheduleConflictResponse;
import lombok.Getter;

@Getter
public class ScheduleConflictException extends RuntimeException {
    private final ScheduleConflictResponse conflictResponse;

    public ScheduleConflictException(ScheduleConflictResponse conflictResponse) {
        super("Trùng ca học học sinh hoặc giảng viên");
        this.conflictResponse = conflictResponse;
    }
}

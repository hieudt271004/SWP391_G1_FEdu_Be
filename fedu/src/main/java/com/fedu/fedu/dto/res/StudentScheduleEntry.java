package com.fedu.fedu.dto.res;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@Builder
public class StudentScheduleEntry {
    private Long nodeId;
    private String title;
    private String description;
    private LocalDate studyDate;
    private Long slotId;
    private String slotName;
    private LocalTime startTime;
    private LocalTime endTime;
    private String subjectName;
    private String subjectCode;
    private String className;
    private Long classroomSubjectId;
    private String status;
}

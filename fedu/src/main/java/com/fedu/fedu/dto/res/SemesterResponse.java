package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SemesterResponse {
    private Long semesterId;
    private String term;
    private Integer academicYear;
    private LocalDate startDate;
    private LocalDate endDate;
    private String semesterLabel;
}

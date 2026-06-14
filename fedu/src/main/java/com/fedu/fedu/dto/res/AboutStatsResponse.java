package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AboutStatsResponse {
    private long totalStudents;
    private long totalTeachers;
    private long totalClassrooms;
    private long totalSubjects;
}

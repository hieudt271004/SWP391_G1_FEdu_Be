package com.fedu.fedu.dto.res;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlacementQuizDetailsResponse {
    private Long testId;
    private String title;
    private String description;
    private Integer durationMinutes;
    private List<ScoreBandResponse> scoreBands;
    private int questionCount;
}
